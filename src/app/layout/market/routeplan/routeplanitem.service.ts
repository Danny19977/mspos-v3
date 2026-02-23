import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { NetworkService } from '../../../services/network.service';
import { SyncQueueService } from '../../../shared/services/sync-queue.service';
import { db } from '../../../shared/services/db';
import { IRoutePlanItem } from './models/routeplanItem.model';
import { v4 as uuidv4 } from 'uuid';
import { IPos } from '../pos-vente/models/pos.model';

@Injectable({
  providedIn: 'root'
})
export class RouteplanItemService extends ApiService {
  endpoint: string = `${environment.apiUrl}/routeplan-items`;

  private networkService = this.injector.get(NetworkService);
  private syncQueue = this.injector.get(SyncQueueService);

  /**
   * Récupère tous les items d'un RoutePlan par UUID
   * Online  : appel HTTP direct (bypass offlineService)
   * Offline : lecture IndexedDB
   */
  override getAllById(routeplanUuid: string): Observable<any> {
    if (this.networkService.isOnline()) {
      const url = `${this.endpoint}/all/${routeplanUuid}`;
      console.log('📡 getAllById URL:', url);
      return this.http.get<any>(url).pipe(
        switchMap(async (res) => {
          const serverItems: IRoutePlanItem[] = res?.data || [];

          // Mettre en cache local les items reçus du serveur
          if (serverItems.length) {
            await this.cacheItemsLocally(routeplanUuid, serverItems);
          }

          // Fusionner avec les items locaux encore en attente de sync
          // (non encore soumis au serveur) pour éviter qu'ils disparaissent
          const serverUuids = new Set(serverItems.map((i: any) => i.uuid));
          const localPending = await this.getPendingItemsForRoutePlan(routeplanUuid);
          const pendingNotOnServer = localPending.filter(i => !serverUuids.has(i.uuid));

          const merged = [...serverItems, ...pendingNotOnServer];
          console.log(`🔀 Items serveur: ${serverItems.length}, items locaux pending: ${pendingNotOnServer.length}`);
          return { ...res, data: merged };
        }),
        catchError(err => {
          console.error('❌ HTTP getAllById failed:', err.status, err.message, url);
          // Fallback : lecture depuis le cache local
          return from(this.getItemsFromLocalCache(routeplanUuid));
        })
      );
    }
    // Mode offline : lire depuis IndexedDB
    return from(this.getItemsFromLocalCache(routeplanUuid));
  }

  /**
   * Retourne les items locaux pending (pas encore synqués) pour un routeplan donné
   */
  private async getPendingItemsForRoutePlan(routeplanUuid: string): Promise<IRoutePlanItem[]> {
    try {
      const items = await db.routePlanItems
        .filter(item =>
          ((item as any).routplan_uuid === routeplanUuid || (item as any).routeplan_uuid === routeplanUuid)
          && (item as any).sync_status === 'pending'
        )
        .toArray();

      return await Promise.all(
        items.map(async item => {
          const pos = await db.pos.where('uuid').equals(item.pos_uuid).first();
          return {
            ...item,
            Pos: pos || { uuid: item.pos_uuid, name: item.pos_uuid, shop: '--', postype: '--', gerant: '--' } as IPos
          };
        })
      );
    } catch {
      return [];
    }
  }

  /**
   * Met en cache local les items reçus du serveur.
   *
   * Stratégie anti-doublons : on récupère les ids locaux existants par uuid
   * avant le bulkPut pour éviter de créer des doublons à chaque sync.
   */
  private async cacheItemsLocally(routeplanUuid: string, items: IRoutePlanItem[]): Promise<void> {
    try {
      const incomingUuids = items.map((i: any) => i.uuid).filter(Boolean) as string[];
      const existingRecords = await db.routePlanItems.where('uuid').anyOf(incomingUuids).toArray();
      const uuidToLocalId = new Map<string, number>();
      for (const rec of existingRecords) {
        if ((rec as any).uuid && rec.ID != null) uuidToLocalId.set((rec as any).uuid, rec.ID as number);
      }

      const records = items.map((item: any) => ({
        ...(uuidToLocalId.has(item.uuid) ? { id: uuidToLocalId.get(item.uuid) } : {}),
        ...item,
        routplan_uuid: item.routeplan_uuid || routeplanUuid,
        sync_status: 'synced',
      }));
      await db.routePlanItems.bulkPut(records as any);
      console.log(`💾 ${records.length} items mis en cache local pour routeplan ${routeplanUuid} (${uuidToLocalId.size} mis à jour, ${records.length - uuidToLocalId.size} nouveaux)`);
    } catch (err) {
      console.error('❌ Erreur mise en cache items:', err);
    }
  }

  /**
   * Lit les items locaux depuis IndexedDB et enrichit avec les données POS
   */
  private async getItemsFromLocalCache(routeplanUuid: string): Promise<{ data: IRoutePlanItem[] }> {
    try {
      // Index Dexie : routplan_uuid (sans 'e')
      let items = await db.routePlanItems
        .where('routplan_uuid').equals(routeplanUuid)
        .toArray();

      // Fallback : items cachés depuis le serveur avec routeplan_uuid (avec 'e')
      if (items.length === 0) {
        items = await db.routePlanItems
          .filter(item => (item as any).routeplan_uuid === routeplanUuid)
          .toArray();
      }

      console.log(`📦 Items locaux pour ${routeplanUuid}:`, items.length);

      const enriched: IRoutePlanItem[] = await Promise.all(
        items.map(async item => {
          const pos = await db.pos.where('uuid').equals(item.pos_uuid).first();
          return {
            ...item,
            Pos: pos || { uuid: item.pos_uuid, name: item.pos_uuid, shop: '--', postype: '--', gerant: '--' } as IPos
          };
        })
      );

      return { data: enriched };
    } catch (err) {
      console.error('❌ Erreur lecture cache local items:', err);
      return { data: [] };
    }
  }

  /**
   * LOCAL FIRST — Crée un RoutePlanItem dans IndexedDB, puis synchronise en arrière-plan.
   * La sauvegarde locale est immédiate et ne dépend pas de la connexion.
   * La synchronisation vers le serveur est déclenchée automatiquement si online.
   */
  override create(data: IRoutePlanItem): Observable<any> {
    const tempUuid = uuidv4();
    const itemData: IRoutePlanItem = {
      ...data,
      uuid: tempUuid,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };

    // Étape 1 : sauvegarder localement (toujours, quelle que soit la connectivité)
    return from(this.createItemLocally(itemData)).pipe(
      switchMap(async () => {
        // ✅ Ne synchroniser que si le routeplan a plus de 10 items enregistrés
        const itemCount = await db.routePlanItems
          .where('routplan_uuid').equals(data.routeplan_uuid || '')
          .count();

        if (itemCount > 10) {
          // Étape 2a : enregistrer cet item dans la file de synchronisation
          await this.syncQueue.enqueue({
            operationId: uuidv4(),
            entityType: 'routeplanItem',
            operation: 'create',
            endpoint: `${this.endpoint}/create`,
            data: { ...itemData, routeplan_uuid: data.routeplan_uuid },
            tempId: tempUuid,
            timestamp: new Date(),
            retryCount: 0,
            status: 'pending',
          });

          // Étape 2b : si c'est exactement le 11e item, enqueue aussi le routeplan parent
          // (le routeplan lui-même n'a pas été enqueueé à la création car count était 0)
          if (itemCount === 11) {
            const parentPlan = await db.routePlans.where('uuid').equals(data.routeplan_uuid || '').first();
            if (parentPlan) {
              const routeplanEndpoint = `${environment.apiUrl}/routeplans`;
              await this.syncQueue.enqueue({
                operationId: uuidv4(),
                entityType: 'routeplan',
                operation: 'create',
                endpoint: `${routeplanEndpoint}/create`,
                data: parentPlan,
                tempId: parentPlan.uuid,
                timestamp: new Date(),
                retryCount: 0,
                status: 'pending',
                userId: (parentPlan as any).user_uuid
              });
              console.log('✅ RoutePlan parent enfilé pour sync (seuil de 10 items atteint)');
            }
          }

          // Étape 3 : déclencher la synchronisation en arrière-plan si online
          if (this.networkService.isOnline()) {
            this.syncQueue.processQueue().catch(err =>
              console.warn('⚠️ Sync arrière-plan routeplanItem (non bloquant):', err?.message)
            );
          }
        } else {
          console.log(`⏸️ RoutePlanItem enregistré localement — sync différée (${itemCount}/10 items minimum requis)`);
        }

        return { data: itemData, offline: !this.networkService.isOnline() };
      })
    );
  }

  /**
   * OFFLINE FIRST — Met à jour un RoutePlanItem localement (ex: marquer status=true/false)
   * puis synchronise en arrière-plan si en ligne.
   */
  override update(uuid: string, data: Partial<IRoutePlanItem>): Observable<any> {
    return from(this.updateItemLocally(uuid, data)).pipe(
      switchMap(async (updatedItem) => {
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'routeplanItem',
          operation: 'update',
          endpoint: `${this.endpoint}/update/${uuid}`,
          data: { uuid, ...data },
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
        });

        if (this.networkService.isOnline()) {
          this.syncQueue.processQueue().catch(err =>
            console.warn('⚠️ Sync arrière-plan routeplanItem update (non bloquant):', err?.message)
          );
        }

        console.log(`✅ RoutePlanItem ${uuid} mis à jour localement:`, data);
        return { data: updatedItem, offline: !this.networkService.isOnline() };
      })
    );
  }

  private async updateItemLocally(uuid: string, data: Partial<IRoutePlanItem>): Promise<Partial<IRoutePlanItem>> {
    await (db.routePlanItems.where('uuid').equals(uuid) as any).modify(data);
    console.log(`💾 RoutePlanItem ${uuid} mis à jour localement:`, data);
    return { uuid, ...data };
  }

  /**
   * OFFLINE FIRST — Supprime un RoutePlanItem localement et met en file de sync
   */
  override delete(uuid: string): Observable<any> {
    return from(db.routePlanItems.where('uuid').equals(uuid).delete()).pipe(
      switchMap(async () => {
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'routeplanItem',
          operation: 'delete',
          endpoint: `${this.endpoint}/delete/${uuid}`,
          data: { uuid },
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
        });

        return { success: true };
      })
    );
  }

  /**
   * Récupère les items d'un RoutePlan depuis le cache local
   */
  async getLocalItemsByRoutePlanUuid(routeplanUuid: string): Promise<IRoutePlanItem[]> {
    try {
      return await db.routePlanItems
        .where('routplan_uuid')
        .equals(routeplanUuid)
        .toArray();
    } catch (err) {
      console.error('❌ Erreur lecture items locaux:', err);
      return [];
    }
  }

  private async createItemLocally(item: IRoutePlanItem): Promise<IRoutePlanItem> {
    // Stocker avec l'index attendu par Dexie (routplan_uuid — sans 'e')
    const record: any = {
      ...item,
      routplan_uuid: item.routeplan_uuid,
      sync_status: 'pending',
    };
    await db.routePlanItems.add(record);
    return item;
  }
}
