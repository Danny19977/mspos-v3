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
          endpoint: this.endpoint,
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
   */
  override update(uuid: string, data: IPosFormItem): Observable<any> {
    const itemData: IPosFormItem = {
      ...data,
      uuid,
      sync_status: 'pending',
      UpdatedAt: new Date()
    };

    return from(this.updateItemLocally(uuid, itemData)).pipe(
      switchMap(async (updatedItem) => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'posformItem',
          operation: 'update',
          endpoint: `${this.endpoint}/${uuid}`,
          data: itemData,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending'
        });

        console.log('✅ PosformItem modifié localement et mis en file de synchronisation');
        
        return {
          data: updatedItem,
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
   */
  override delete(uuid: string): Observable<any> {
    return from(this.deleteItemLocally(uuid)).pipe(
      switchMap(async () => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'posformItem',
          operation: 'delete',
          endpoint: `${this.endpoint}/${uuid}`,
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
      })
    );
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
   * Récupère les items par posform_uuid
   */
  async getItemsByPosformUuid(posform_uuid: string): Promise<IPosFormItem[]> {
    const items = await db.posformItems
      .where('posform_uuid')
      .equals(posform_uuid)
      .toArray();
    
    console.log(`📦 ${items.length} PosformItems récupérés pour posform ${posform_uuid}`);
    return items;
  }
}
