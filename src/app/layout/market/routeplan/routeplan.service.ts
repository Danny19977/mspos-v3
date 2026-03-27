import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { NetworkService } from '../../../services/network.service';
import { SyncQueueService } from '../../../shared/services/sync-queue.service';
import { db } from '../../../shared/services/db';
import { IRoutePlan } from './models/routeplan.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * RouteplanService - Mode OFFLINE FIRST avec validation journalière
 * 
 * - Les RoutePlans sont stockés localement et accessibles hors ligne
 * - Les opérations CRUD se font d'abord en local
 * - Limitation : UN SEUL Routeplan par jour (00h00 - 23h59)
 * - Utilise les POS stockés en local pour créer le Routeplan
 * - La synchronisation avec le serveur se fait en arrière-plan
 */
@Injectable({
  providedIn: 'root'
})
export class RouteplanService extends ApiService {
  endpoint: string = `${environment.apiUrl}/routeplans`;

  constructor(
    protected override http: HttpClient,
    protected override injector: Injector,
    private networkService: NetworkService,
    private syncQueue: SyncQueueService
  ) {
    super(http, injector);
  }

  /**
   * Récupère tous les RoutePlans de l'utilisateur - OFFLINE FIRST
   */
  getUserRoutePlans(userId: string): Observable<any> {
    return from(this.getFromLocalCacheByUser(userId));
  }

  /**
   * Récupère le RoutePlan du jour pour un utilisateur
   */
  getTodayRoutePlan(userId: string): Observable<IRoutePlan | null> {
    return from(this.getTodayRoutePlanFromLocal(userId));
  }

  /**
   * Récupère le RoutePlan du jour - OFFLINE FIRST
   * Retourne immédiatement depuis IndexedDB, synchronise le serveur en arrière-plan si en ligne.
   */
  getTodayRoutePlanOfflineFirst(userId: string): Observable<IRoutePlan | null> {
    return from(this.getTodayRoutePlanFromLocal(userId));
  }

  /**
   * Vérifie si l'utilisateur a déjà créé un Routeplan aujourd'hui
   */
  async hasTodayRoutePlan(userId: string): Promise<boolean> {
    const todayPlan = await this.getTodayRoutePlanFromLocal(userId);
    return todayPlan !== null;
  }

  /**
   * Récupère le Routeplan du jour depuis le cache local
   */
  private async getTodayRoutePlanFromLocal(userId: string): Promise<IRoutePlan | null> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const routePlans = await db.routePlans
      .where('user_uuid')
      .equals(userId)
      .filter(plan => {
        const createdAt = new Date(plan.CreatedAt!);
        return createdAt >= startOfDay && createdAt <= endOfDay;
      })
      .toArray();

    return routePlans.length > 0 ? routePlans[0] : null;
  }

  /**
   * Crée un nouveau RoutePlan - OFFLINE FIRST avec validation journalière
   */
  override create(data: IRoutePlan): Observable<any> {
    // Vérifier d'abord si un Routeplan existe déjà aujourd'hui
    return from(this.hasTodayRoutePlan(data.user_uuid)).pipe(
      switchMap(async (hasToday) => {
        if (hasToday) {
          throw new Error('❌ Vous avez déjà créé un plan de route aujourd\'hui. Un seul plan par jour est autorisé (00h00 - 23h59).');
        }

        const tempUuid = uuidv4();
        const routePlanData: IRoutePlan = {
          ...data,
          uuid: tempUuid,
          sync_status: 'pending',
          temp_id: tempUuid,
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        };

        // Créer en local
        await this.createRoutePlanLocally(routePlanData);

        // Déclencher la sync des données en attente (>24h) en arrière-plan
        this.triggerSyncOldPendingData(data.user_uuid);
        console.log('⏸️ RoutePlan créé localement — sera synchronisé après 24h d\'activité');

        return {
          data: routePlanData,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'Plan de route créé, synchronisation en cours...' 
            : 'Plan de route créé localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Met à jour un RoutePlan - OFFLINE FIRST
   */
  override update(uuid: string, data: IRoutePlan): Observable<any> {
    const routePlanData: IRoutePlan = {
      ...data,
      uuid,
      sync_status: 'pending',
      UpdatedAt: new Date()
    };

    return from(this.updateRoutePlanLocally(uuid, routePlanData)).pipe(
      switchMap(async (updatedPlan) => {
        // Déclencher la sync des données en attente (>24h) en arrière-plan
        this.triggerSyncOldPendingData(data.user_uuid);
        console.log('⏸️ RoutePlan modifié localement — sera synchronisé après 24h d\'activité');

        return {
          data: updatedPlan,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'Plan de route modifié, synchronisation en cours...' 
            : 'Plan de route modifié localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Supprime un RoutePlan - OFFLINE FIRST
   */
  override delete(uuid: string): Observable<any> {
    return from(
      // Lire le plan AVANT suppression locale pour connaître son sync_status
      db.routePlans.where('uuid').equals(uuid).first()
    ).pipe(
      switchMap(async (existingPlan) => {
        const wasSynced = existingPlan?.sync_status === 'synced';

        // Supprimer localement
        await this.deleteRoutePlanLocally(uuid);

        if (wasSynced) {
          // Le routeplan existe sur le serveur : enqueue le DELETE
          await this.syncQueue.enqueue({
            operationId: uuidv4(),
            entityType: 'routeplan',
            operation: 'delete',
            endpoint: `${this.endpoint}/delete/${uuid}`,
            data: { uuid },
            timestamp: new Date(),
            retryCount: 0,
            status: 'pending'
          });
          console.log('✅ RoutePlan supprimé localement et mis en file de synchronisation');
        } else {
          // Le routeplan n'a jamais été envoyé au serveur :
          // annuler toute opération create en attente pour cet UUID
          await this.syncQueue.cancelPendingCreates('routeplan', uuid);
          console.log('✅ RoutePlan local (jamais synchronisé) supprimé — aucune requête serveur nécessaire');
        }

        return {
          success: true,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline()
            ? 'Plan de route supprimé, synchronisation en cours...'
            : 'Plan de route supprimé localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Récupère les POS locaux pour créer un Routeplan
   * Utilise la liste des POS stockés en local
   */
  getLocalPosForRoutePlan(userId: string, userRole?: string, territoryUuid?: string): Observable<any> {
    return from(this.getLocalPosList(userId, userRole, territoryUuid));
  }

  /**
   * Récupère la liste des POS locaux selon le rôle de l'utilisateur
   */
  private async getLocalPosList(userId: string, userRole?: string, territoryUuid?: string): Promise<any> {
    let collection = db.pos.toCollection();

    // Filtrer selon le rôle (même logique que dans PosVenteService)
    if (userRole === 'ASM' && territoryUuid) {
      collection = db.pos.where('province_uuid').equals(territoryUuid);
    } else if (userRole === 'Supervisor' && territoryUuid) {
      collection = db.pos.where('area_uuid').equals(territoryUuid);
    } else if (userRole === 'DR' && territoryUuid) {
      collection = db.pos.where('sub_area_uuid').equals(territoryUuid);
    } else if (userRole === 'Cyclo' && territoryUuid) {
      collection = db.pos.where('commune_uuid').equals(territoryUuid);
    }

    const posList = await collection.toArray();

    return {
      data: posList,
      total: posList.length,
      offline: true,
      message: `${posList.length} POS disponibles localement pour créer votre plan de route`
    };
  }

  /**
   * Récupère depuis le cache local par utilisateur
   */
  private async getFromLocalCacheByUser(userId: string): Promise<any> {
    const routePlans = await db.routePlans
      .where('user_uuid')
      .equals(userId)
      .toArray();

    // Trier par date de création (plus récent en premier)
    routePlans.sort((a, b) => {
      const dateA = new Date(a.CreatedAt!).getTime();
      const dateB = new Date(b.CreatedAt!).getTime();
      return dateB - dateA;
    });

    return {
      data: routePlans,
      total: routePlans.length,
      page: 1,
      page_size: routePlans.length,
      offline: !this.networkService.isOnline()
    };
  }

  /**
   * Crée un RoutePlan en local
   */
  private async createRoutePlanLocally(routePlan: IRoutePlan): Promise<IRoutePlan> {
    await db.routePlans.add(routePlan);
    return routePlan;
  }

  /**
   * Met à jour un RoutePlan en local
   */
  private async updateRoutePlanLocally(uuid: string, routePlan: IRoutePlan): Promise<any> {
    // Utiliser uniquement les champs essentiels pour éviter les références circulaires
    await (db.routePlans.where('uuid').equals(uuid) as any).modify({
      sync_status: 'pending',
      UpdatedAt: new Date()
    });
    return routePlan;
  }

  /**
   * Supprime un RoutePlan en local
   */
  private async deleteRoutePlanLocally(uuid: string): Promise<void> {
    await db.routePlans.where('uuid').equals(uuid).delete();
  }

  /**
   * Récupère les RoutePlans locaux en attente de synchronisation (sync_status === 'pending')
   * Utilisé pour afficher les données créées offline dans la liste principale
   */
  async getLocalPendingRoutePlans(userId: string): Promise<IRoutePlan[]> {
    try {
      const plans = await db.routePlans
        .where('user_uuid')
        .equals(userId)
        .filter(plan => plan.sync_status === 'pending')
        .toArray();

      // Trier par date décroissante (plus récent en premier)
      plans.sort((a, b) =>
        new Date(b.CreatedAt!).getTime() - new Date(a.CreatedAt!).getTime()
      );

      return plans;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des plans locaux:', error);
      return [];
    }
  }

  /**
   * Synchronise en arrière-plan toutes les données en attente de plus de 24h :
   *  - Phase 1 : RoutePlans pending > 24h de l’utilisateur (si userId fourni) + leurs items pending
   *  - Phase 2 : Items orphelins pending > 24h dont le RoutePlan parent est déjà synchronisé
   * Point d’entrée unique appelé par RouteplanService ET RouteplanItemService.
   */
  triggerSyncOldPendingData(userId?: string): void {
    if (!this.networkService.isOnline()) return;

    // Seuil = début du jour courant (00:00:00.000)
    // Tout ce qui a été créé AVANT aujourd'hui (j-1, j-2, …) est synchronisé.
    // Les données d'aujourd'hui (00:00 → 23:59) restent en local.
    const today = new Date();
    const threshold = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const routeplanItemEndpoint = `${environment.apiUrl}/routeplan-items`;

    (async () => {
      try {
        // --- Phase 1 : RoutePlans pending > 24h (filteré par userId si précisé) ---
        const syncedPlanUuids = new Set<string>();

        if (userId) {
          const oldPlans = await db.routePlans
            .where('user_uuid').equals(userId)
            .filter(plan => plan.sync_status === 'pending' && new Date(plan.CreatedAt!) <= threshold)
            .toArray();

          for (const plan of oldPlans) {
            await this.syncQueue.enqueue({
              operationId: uuidv4(),
              entityType: 'routeplan',
              operation: 'create',
              endpoint: `${this.endpoint}/create`,
              data: plan,
              tempId: plan.uuid,
              timestamp: new Date(),
              retryCount: 0,
              status: 'pending',
              userId: plan.user_uuid
            });

            // Enqueue les items pending de ce plan
            const planItems = await db.routePlanItems
              .filter(item =>
                ((item as any).routplan_uuid === plan.uuid || (item as any).routeplan_uuid === plan.uuid)
                && (item as any).sync_status === 'pending'
              )
              .toArray();

            for (const item of planItems) {
              await this.syncQueue.enqueue({
                operationId: uuidv4(),
                entityType: 'routeplanItem',
                operation: 'create',
                endpoint: `${routeplanItemEndpoint}/create`,
                data: { ...item, routeplan_uuid: (item as any).routeplan_uuid || (item as any).routplan_uuid || plan.uuid },
                tempId: (item as any).uuid,
                timestamp: new Date(),
                retryCount: 0,
                status: 'pending',
              });
              syncedPlanUuids.add(plan.uuid!); // marqué : déjà traité en phase 1
            }

            if (planItems.length === 0) syncedPlanUuids.add(plan.uuid!);
          }
        }

        // --- Phase 2 : Items orphelins pending > 24h dont le parent est déjà synced ---
        const allOldItems = await db.routePlanItems
          .filter(item =>
            (item as any).sync_status === 'pending' &&
            new Date((item as any).CreatedAt) <= threshold
          )
          .toArray();

        for (const item of allOldItems) {
          const parentUuid = (item as any).routplan_uuid || (item as any).routeplan_uuid;
          if (!parentUuid || syncedPlanUuids.has(parentUuid)) continue; // déjà géré en phase 1

          const parent = await db.routePlans.where('uuid').equals(parentUuid).first();
          if (!parent || parent.sync_status === 'pending') continue; // parent pas encore syncé

          await this.syncQueue.enqueue({
            operationId: uuidv4(),
            entityType: 'routeplanItem',
            operation: 'create',
            endpoint: `${routeplanItemEndpoint}/create`,
            data: { ...item, routeplan_uuid: (item as any).routeplan_uuid || (item as any).routplan_uuid },
            tempId: (item as any).uuid,
            timestamp: new Date(),
            retryCount: 0,
            status: 'pending',
          });
        }

        await this.syncQueue.processQueue();
        console.log('✅ Sync données > 24h terminée');
      } catch (err) {
        console.warn('⚠️ Erreur sync données anciennes (non bloquant):', err);
      }
    })();
  }

}

