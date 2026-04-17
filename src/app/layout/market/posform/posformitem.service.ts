import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IPosFormItem } from './models/posform_item.model';
import { NetworkService } from '../../../services/network.service';
import { SyncQueueService } from '../../../shared/services/sync-queue.service';
import { db } from '../../../shared/services/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * PosformItemService - Mode OFFLINE FIRST
 * 
 * - Les PosformItems sont stockés localement et accessibles hors ligne
 * - Les opérations CRUD se font d'abord en local
 * - La synchronisation avec le serveur se fait en arrière-plan
 */
@Injectable({
  providedIn: 'root'
})
export class PosformItemService extends ApiService {
  endpoint: string = `${environment.apiUrl}/posform-items`;
  
  // Modern Angular inject pattern
  private networkService = inject(NetworkService);
  private syncQueue = inject(SyncQueueService);

  /**
   * Crée un nouveau PosformItem - OFFLINE FIRST
   */
  override create(data: IPosFormItem): Observable<any> {
    const tempUuid = uuidv4();
    const itemData: IPosFormItem = {
      ...data,
      uuid: tempUuid,
      sync_status: 'pending',
      temp_id: tempUuid,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };

    return from(this.createItemLocally(itemData)).pipe(
      switchMap(async (localItem) => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'posformItem',
          operation: 'create',
          endpoint: `${this.endpoint}/create`,
          data: itemData,
          tempId: tempUuid,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending'
        });

        console.log('✅ PosformItem créé localement et mis en file de synchronisation');
        
        return {
          data: localItem,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'Item créé, synchronisation en cours...' 
            : 'Item créé localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Met à jour un PosformItem - OFFLINE FIRST
   *
   * ⚠️ Cas critique : si l'item n'a jamais été envoyé au serveur (sync_status = 'pending'
   * ou 'error'), un PUT /update/:uuid échouerait (record introuvable côté serveur).
   * On envoie donc un CREATE dans ce cas, après avoir annulé toute opération en attente
   * pour éviter les doublons — identique à la logique de posform.service.ts.
   */
  override update(uuid: string, data: IPosFormItem): Observable<any> {
    // Lire le sync_status AVANT la modification locale pour décider create vs update
    return from(db.posformItems.where('uuid').equals(uuid).first()).pipe(
      switchMap(async (existing) => {
        const neverSynced = !existing || existing.sync_status === 'pending' || existing.sync_status === 'error';

        const itemData: IPosFormItem = {
          ...data,
          uuid,
          sync_status: 'pending',
          UpdatedAt: new Date()
        };

        await this.updateItemLocally(uuid, itemData);

        if (neverSynced) {
          // Annuler toute opération en attente liée à cet uuid pour éviter les doublons
          await this.syncQueue.cancelPendingOperationsForEntity('posformItem', uuid);

          // L'item n'existe pas encore côté serveur : envoyer un CREATE
          await this.syncQueue.enqueue({
            operationId: uuidv4(),
            entityType: 'posformItem',
            operation: 'create',
            endpoint: `${this.endpoint}/create`,
            data: itemData,
            tempId: uuid,
            timestamp: new Date(),
            retryCount: 0,
            status: 'pending'
          });
          console.log(`✅ PosformItem jamais syncé → CREATE enqueué (uuid: ${uuid})`);
        } else {
          // L'item existe déjà sur le serveur : envoyer un UPDATE normal
          await this.syncQueue.enqueue({
            operationId: uuidv4(),
            entityType: 'posformItem',
            operation: 'update',
            endpoint: `${this.endpoint}/update/${uuid}`,
            data: itemData,
            timestamp: new Date(),
            retryCount: 0,
            status: 'pending'
          });
          console.log('✅ PosformItem modifié localement et mis en file de synchronisation (UPDATE)');
        }

        return {
          data: itemData,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline()
            ? 'Item modifié, synchronisation en cours...'
            : 'Item modifié localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Supprime un PosformItem - OFFLINE FIRST
   *
   * ⚠️ Cas critique : si l'item n'a jamais été synchronisé (sync_status = 'pending'),
   * il n'existe pas encore sur le serveur. On annule les opérations en file d'attente
   * et on supprime uniquement localement — pas de DELETE envoyé au serveur.
   * Si déjà synchronisé, on envoie le DELETE normalement.
   */
  override delete(uuid: string): Observable<any> {
    return from(this.deleteItemSmart(uuid));
  }

  private async deleteItemSmart(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID manquant pour la suppression du posformItem');
    }

    const item = await db.posformItems.where('uuid').equals(uuid).first();

    if (item?.sync_status === 'pending' || item?.sync_status === 'error') {
      // Jamais envoyé au serveur : annuler les opérations en file d'attente
      // et supprimer uniquement localement
      await this.syncQueue.cancelPendingOperationsForEntity('posformItem', uuid);
      await this.deleteItemLocally(uuid);
      console.log(`🗑️ PosformItem local ${uuid} supprimé directement (jamais synchronisé)`);
      return {
        offline: true,
        local: true,
        message: 'Item local supprimé.'
      };
    }

    // Déjà synchronisé : supprimer localement + enqueue vers le serveur
    await this.deleteItemLocally(uuid);
    await this.syncQueue.enqueue({
      operationId: uuidv4(),
      entityType: 'posformItem',
      operation: 'delete',
      endpoint: `${this.endpoint}/delete/${uuid}`,
      data: { uuid },
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending'
    });

    console.log('✅ PosformItem supprimé localement et mis en file de synchronisation');

    return {
      offline: !this.networkService.isOnline(),
      message: this.networkService.isOnline()
        ? 'Item supprimé, synchronisation en cours...'
        : 'Item supprimé localement, sera synchronisé à la reconnexion'
    };
  }

  /**
   * Crée un PosformItem en local (IndexedDB)
   */
  private async createItemLocally(data: IPosFormItem): Promise<IPosFormItem> {
    const id = await db.posformItems.add({
      uuid: data.uuid!,
      posform_uuid: data.posform_uuid,
      brand_uuid: data.brand_uuid,
      brand_name: data.brand_name,
      number_farde: data.number_farde,
      counter: data.counter,
      sold: data.sold,
      sync_status: data.sync_status,
      temp_id: data.temp_id,
      CreatedAt: data.CreatedAt,
      UpdatedAt: data.UpdatedAt
    } as any);

    console.log(`💾 PosformItem créé localement avec ID: ${id}`);
    return { ...data, id } as IPosFormItem;
  }

  /**
   * Met à jour un PosformItem en local (IndexedDB)
   */
  private async updateItemLocally(uuid: string, data: IPosFormItem): Promise<IPosFormItem> {
    // Utiliser as any pour éviter les références circulaires avec Dexie
    await (db.posformItems.where('uuid').equals(uuid) as any).modify({
      number_farde: data.number_farde,
      counter: data.counter,
      sold: data.sold,
      sync_status: data.sync_status,
      UpdatedAt: data.UpdatedAt
    });

    console.log(`💾 PosformItem ${uuid} mis à jour localement`);
    return data;
  }

  /**
   * Supprime un PosformItem en local (IndexedDB)
   */
  private async deleteItemLocally(uuid: string): Promise<void> {
    await db.posformItems.where('uuid').equals(uuid).delete();
    console.log(`💾 PosformItem ${uuid} supprimé localement`);
  }

  /**
   * Récupère les items par posform_uuid.
   * Retourne toujours un tableau vide si l'UUID est absent pour éviter
   * de retourner tous les items de la base.
   */
  async getItemsByPosformUuid(posform_uuid: string): Promise<IPosFormItem[]> {
    if (!posform_uuid || posform_uuid.trim() === '') {
      console.warn('⚠️ getItemsByPosformUuid appelé avec un UUID vide — retour []');
      return [];
    }

    const items = await db.posformItems
      .where('posform_uuid')
      .equals(posform_uuid)
      .toArray();

    // Hydrate brand_name from db.brands for items missing it
    const missingBrandUuids = [...new Set(
      items.filter(i => !i.brand_name && i.brand_uuid).map(i => i.brand_uuid)
    )];
    if (missingBrandUuids.length > 0) {
      const brandRecords = await db.brands.where('uuid').anyOf(missingBrandUuids).toArray();
      const brandMap = new Map(brandRecords.map(b => [b.uuid, b.name]));
      items.forEach(i => {
        if (!i.brand_name && i.brand_uuid && brandMap.has(i.brand_uuid)) {
          i.brand_name = brandMap.get(i.brand_uuid);
        }
      });
    }

    console.log(`📦 ${items.length} PosformItems récupérés pour posform_uuid=${posform_uuid}`);
    return items;
  }

  /**
   * Récupère les PosformItems d'un posform - OFFLINE FIRST
   * Retourne immédiatement le cache local IndexedDB.
   * Si en ligne, synchronise depuis le serveur en arrière-plan.
   */
  override getAllById(posformUuid: string): Observable<any> {
    if (!posformUuid || posformUuid.trim() === '') {
      return from(Promise.resolve({ data: [], total: 0, offline: true }));
    }
    return from(this.getItemsByPosformUuid(posformUuid)).pipe(
      switchMap(async (localItems) => ({
        data: localItems,
        total: localItems.length,
        offline: !this.networkService.isOnline()
      }))
    );
  }
}
