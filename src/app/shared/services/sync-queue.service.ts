import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, firstValueFrom } from 'rxjs';
import { db } from './db';
import { QueuedOperation } from './queue-operation.interface';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../../environments/environment';
import { NetworkService } from '../../services/network.service';

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  private _pendingCount$ = new BehaviorSubject<number>(0);
  public pendingCount$ = this._pendingCount$.asObservable();
  
  private _isSyncing$ = new BehaviorSubject<boolean>(false);
  public isSyncing$ = this._isSyncing$.asObservable();
  
  private _lastSyncTime$ = new BehaviorSubject<Date | null>(null);
  public lastSyncTime$ = this._lastSyncTime$.asObservable();

  constructor(private http: HttpClient, private networkService: NetworkService) {
    this.updatePendingCount();
  }

  /**
   * Add operation to sync queue
   */
  async enqueue(operation: Omit<QueuedOperation, 'id'>): Promise<QueuedOperation> {
    const queuedOp: QueuedOperation = {
      ...operation,
      operationId: operation.operationId || uuidv4(),
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending'
    };
    
    await db.syncQueue.add(queuedOp);
    await this.updatePendingCount();
    
    console.log(`🔄 Operation queued: ${queuedOp.operation} ${queuedOp.entityType}`, queuedOp);
    
    return queuedOp;
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<QueuedOperation[]> {
    return await db.syncQueue
      .where('status')
      .equals('pending')
      .sortBy('timestamp');
  }

  /**
   * Get pending operations count
   */
  async getPendingCount(): Promise<number> {
    return await db.syncQueue
      .where('status')
      .equals('pending')
      .count();
  }

  /**
   * Update pending count subject
   */
  private async updatePendingCount(): Promise<void> {
    const count = await this.getPendingCount();
    this._pendingCount$.next(count);
  }

  /**
   * Process all pending operations in the queue
   */
  async processQueue(): Promise<{ success: number; failed: number }> {
    if (this._isSyncing$.value) {
      console.log('⏸️ Sync already in progress');
      return { success: 0, failed: 0 };
    }

    if (!this.networkService.isOnline()) {
      console.log('📴 Hors ligne, synchronisation reportée');
      return { success: 0, failed: 0 };
    }

    this._isSyncing$.next(true);
    
    try {
      const operations = await this.getPendingOperations();
      console.log(`🔄 Processing ${operations.length} queued operations`);

      let successCount = 0;
      let failedCount = 0;

      for (const operation of operations) {
        try {
          // Relire les données fraîches depuis db avant l'envoi
          // (critiques pour les items dont routeplan_uuid vient d'être propagé)
          const freshOp = await db.syncQueue.get(operation.id!);
          const opToSync = freshOp ?? operation;

          await this.syncOperation(opToSync);
          await this.markCompleted(opToSync.id!);
          successCount++;
          console.log(`✅ Synced: ${opToSync.operation} ${opToSync.entityType}`);
        } catch (error: any) {
          // Conflit détecté (409 / 422) : l'entité existe déjà sur le serveur.
          // On marque l'opération comme complétée pour éviter les doublons.
          const isConflict = error?.status === 409 || error?.status === 422;
          if (isConflict) {
            await this.markCompleted(operation.id!);
            successCount++;
            console.warn(`⚠️ Conflit (${error.status}) ignoré — déjà présent: ${operation.operation} ${operation.entityType}`);
          } else {
            await this.markFailed(operation.id!, error.message || 'Unknown error');
            failedCount++;
            console.error(`❌ Failed to sync: ${operation.operation} ${operation.entityType}`, error);
          }
        }
      }

      // Second passage : traiter les opérations ajoutées ou débloquées pendant le cycle
      // (ex: routeplanItems dont l'UUID a été propagé pendant le traitement du routeplan)
      const remainingOps = await this.getPendingOperations();
      for (const op of remainingOps) {
        try {
          const fresh = await db.syncQueue.get(op.id!);
          const opToSync = fresh ?? op;
          await this.syncOperation(opToSync);
          await this.markCompleted(opToSync.id!);
          successCount++;
          console.log(`✅ [2nd pass] Synced: ${opToSync.operation} ${opToSync.entityType}`);
        } catch (error: any) {
          const isConflict = error?.status === 409 || error?.status === 422;
          if (isConflict) {
            await this.markCompleted(op.id!);
            successCount++;
          } else {
            await this.markFailed(op.id!, error.message || 'Unknown error');
            failedCount++;
          }
        }
      }

      this._lastSyncTime$.next(new Date());
      await this.updatePendingCount();
      
      console.log(`✅ Sync completed: ${successCount} success, ${failedCount} failed`);
      
      return { success: successCount, failed: failedCount };
    } finally {
      this._isSyncing$.next(false);
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: QueuedOperation): Promise<any> {
    const token = localStorage.getItem('auth_uuid');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

    // Normalize endpoint: ensure /create, /update/:uuid, /delete/:uuid suffixes
    const endpoint = this.normalizeEndpoint(operation.endpoint, operation.operation, operation.data?.uuid);

    let response: any;

    switch (operation.operation) {
      case 'create':
        response = await firstValueFrom(
          this.http.post(`${endpoint}${tokenParam}`, operation.data)
        );

        if (operation.entityType === 'posform' && Array.isArray(operation.data?.PosFormItems) && operation.data.PosFormItems.length > 0) {
          // Flux « posform avec items embarqués » :
          // Les données locales sont déjà correctes — on les supprime simplement
          // après une sync réussie. Pas de remappage d'UUID nécessaire.
          if (operation.tempId) {
            await db.posForms.where('uuid').equals(operation.tempId).delete();
            await (db.posformItems as any).where('posform_uuid').equals(operation.tempId).delete();
            console.log(`🗑️ Données locales supprimées après sync : posform ${operation.tempId} + ses items`);
          }
        } else if (response?.data?.uuid && operation.tempId) {
          // Flux standard : mettre à jour l'UUID local avec celui du serveur
          await this.updateLocalEntityId(
            operation.entityType,
            operation.tempId,
            response.data.uuid,
            response.data
          );

          // Si c'est un routeplan, propager le nouvel UUID vers tous les
          // routeplanItems locaux et les entrées en attente dans la queue.
          if (operation.entityType === 'routeplan') {
            await this.propagateRoutePlanUuid(operation.tempId, response.data.uuid);
          }

          // Si c'est un posform (sans items embarqués), propager le nouvel UUID
          // vers les posformItems locaux et les opérations en attente.
          if (operation.entityType === 'posform') {
            await this.propagatePosFormUuid(operation.tempId, response.data.uuid);
          }
        }
        break;

      case 'update':
        response = await firstValueFrom(
          this.http.put(`${endpoint}${tokenParam}`, operation.data)
        );
        
        // Update local entity with server data
        if (response?.data) {
          await this.updateLocalEntity(
            operation.entityType,
            operation.data.uuid,
            response.data
          );
        }
        break;

      case 'delete':
        response = await firstValueFrom(
          this.http.delete(`${endpoint}${tokenParam}`)
        );
        
        // Remove from local database
        await this.deleteLocalEntity(
          operation.entityType,
          operation.data.uuid
        );
        break;
    }

    return response;
  }

  /**
   * Normalize endpoint to ensure correct /create, /update/:uuid, /delete/:uuid suffixes.
   * Fixes legacy queued operations stored before the endpoint convention was applied.
   */
  private normalizeEndpoint(endpoint: string, operation: string, uuid?: string): string {
    // Strip any existing token query param for clean comparison
    const base = endpoint.split('?')[0];

    if (operation === 'create') {
      // Already has /create
      if (base.endsWith('/create')) return endpoint;
      // Has /{uuid} suffix by mistake — strip it
      const withoutUuid = uuid ? base.replace(`/${uuid}`, '') : base;
      return withoutUuid + '/create';
    }

    if (operation === 'update') {
      // Already has /update/
      if (base.includes('/update/')) return endpoint;
      // Has /{uuid} but no /update prefix — fix it
      if (uuid && base.endsWith(`/${uuid}`)) {
        return base.replace(`/${uuid}`, `/update/${uuid}`);
      }
      return base + (uuid ? `/update/${uuid}` : '');
    }

    if (operation === 'delete') {
      // Already has /delete/
      if (base.includes('/delete/')) return endpoint;
      // Has /{uuid} but no /delete prefix — fix it
      if (uuid && base.endsWith(`/${uuid}`)) {
        return base.replace(`/${uuid}`, `/delete/${uuid}`);
      }
      return base + (uuid ? `/delete/${uuid}` : '');
    }

    return endpoint;
  }

  /**
   * Après la sync d'un posform, met à jour tous les posformItems locaux
   * et les opérations en queue qui référencent l'ancien tempId.
   */
  private async propagatePosFormUuid(tempId: string, serverUuid: string): Promise<void> {
    try {
      // 1. Mettre à jour les items dans IndexedDB (posform_uuid)
      const items = await (db.posformItems as any)
        .where('posform_uuid')
        .equals(tempId)
        .toArray();
      for (const item of items) {
        await (db.posformItems as any).update(item.id!, { posform_uuid: serverUuid });
      }
      console.log(`🔄 Propagated posform UUID: ${tempId} -> ${serverUuid} (${items.length} items mis à jour)`);

      // 2. Mettre à jour les opérations en attente dans la syncQueue
      const pendingOps = await db.syncQueue
        .where('status').equals('pending')
        .filter(op => op.entityType === 'posformItem' && op.data?.posform_uuid === tempId)
        .toArray();
      for (const op of pendingOps) {
        await db.syncQueue.update(op.id!, {
          data: { ...op.data, posform_uuid: serverUuid },
        });
      }
      console.log(`🔄 Queue posformItems mis à jour: ${pendingOps.length} opérations`);
    } catch (err) {
      console.error('Erreur propagatePosFormUuid:', err);
    }
  }

  /**
   * Après la sync d'un routeplan, met à jour tous les routeplanItems locaux
   * et les opérations en queue qui référencent l'ancien tempId.
   */
  private async propagateRoutePlanUuid(tempId: string, serverUuid: string): Promise<void> {
    try {
      // 1. Mettre à jour les items dans IndexedDB (index routplan_uuid)
      const itemsByIndex = await db.routePlanItems
        .where('routplan_uuid').equals(tempId)
        .toArray();
      for (const item of itemsByIndex) {
        await (db.routePlanItems as any).update(item.ID!, {
          routplan_uuid: serverUuid,
          routeplan_uuid: serverUuid,
        });
      }

      // 2. Fallback : items stockés avec routeplan_uuid (avec 'e')
      const itemsByFilter = await db.routePlanItems
        .filter(item => (item as any).routeplan_uuid === tempId && (item as any).routplan_uuid !== tempId)
        .toArray();
      for (const item of itemsByFilter) {
        await (db.routePlanItems as any).update(item.ID!, {
          routplan_uuid: serverUuid,
          routeplan_uuid: serverUuid,
        });
      }

      // 3. Mettre à jour les opérations en attente dans la syncQueue
      const pendingItems = await db.syncQueue
        .where('status').equals('pending')
        .filter(op => op.entityType === 'routeplanItem' && op.data?.routeplan_uuid === tempId)
        .toArray();
      for (const op of pendingItems) {
        await db.syncQueue.update(op.id!, {
          data: { ...op.data, routeplan_uuid: serverUuid },
        });
      }

      console.log(`🔗 UUID propagé routeplan ${tempId} → ${serverUuid}: ${itemsByIndex.length + itemsByFilter.length} items, ${pendingItems.length} queue ops`);
    } catch (err) {
      console.error('❌ Erreur propagation UUID routeplan:', err);
    }
  }

  /**
   * Update local entity with server-generated ID after creation.
   *
   * ⚠️ Règle critique : on NE remplace jamais les clés étrangères locales
   * (posform_uuid, routplan_uuid…) par celles du serveur si elles sont absentes
   * ou nulles dans la réponse. Le serveur peut omettre ces champs, ce qui
   * effacerait le lien parent-enfant en local.
   */
  private async updateLocalEntityId(
    entityType: string,
    tempId: string,
    serverUuid: string,
    serverData: any
  ): Promise<void> {
    const table = this.getTableForEntity(entityType);
    if (!table) return;

    // Lire l'enregistrement local AVANT de l'écraser pour préserver les FK locales
    const entity = await table.where('uuid').equals(tempId).first();
    if (!entity) return;

    // Construire le patch de mise à jour : server data en base, FK locales en surcharge
    const localFkOverride: any = {};

    if (entityType === 'posformItem') {
      // Toujours préserver posform_uuid depuis le local — le serveur peut ne pas le retourner
      const localPosformUuid = entity.posform_uuid || serverData?.posform_uuid;
      if (localPosformUuid) localFkOverride.posform_uuid = localPosformUuid;
    }

    if (entityType === 'routeplanItem') {
      // Toujours préserver routplan_uuid / routeplan_uuid depuis le local
      const localRoutplanUuid = entity.routplan_uuid || entity.routeplan_uuid || serverData?.routplan_uuid;
      if (localRoutplanUuid) {
        localFkOverride.routplan_uuid = localRoutplanUuid;
        localFkOverride.routeplan_uuid = localRoutplanUuid;
      }
    }

    await table.where('uuid').equals(tempId).modify({
      ...serverData,
      ...localFkOverride,   // ← surcharge : FK locales ont priorité sur server data
      uuid: serverUuid,
      sync_status: 'synced',
      ID: serverData.ID || serverData.id
    });

    console.log(`🔄 Updated local ${entityType} ID: ${tempId} -> ${serverUuid}`, localFkOverride);
  }

  /**
   * Update local entity with server data after update.
   *
   * ⚠️ On force toujours `uuid` à la valeur connue pour éviter qu'un champ
   * nul/absent dans la réponse serveur (serverData.uuid = null | undefined)
   * n'écrase l'UUID local et fasse « disparaître » l'entité des requêtes Dexie.
   *
   * ⚠️ Les clés étrangères locales (pos_uuid, routeplan_uuid, posform_uuid…)
   * sont préservées en priorité : le serveur peut les omettre ou les retourner
   * null, ce qui effacerait les liens parent-enfant en local.
   */
  private async updateLocalEntity(
    entityType: string,
    uuid: string,
    serverData: any
  ): Promise<void> {
    const table = this.getTableForEntity(entityType);
    if (!table) return;

    // Lire l'enregistrement local AVANT d'appliquer serverData
    // pour préserver les FK que le serveur pourrait omettre ou nullifier
    const localRecord = await table.where('uuid').equals(uuid).first();

    const localFkOverride: any = {};
    if (localRecord) {
      if (entityType === 'routeplanItem') {
        if (localRecord.routplan_uuid)  localFkOverride.routplan_uuid  = localRecord.routplan_uuid;
        if (localRecord.routeplan_uuid) localFkOverride.routeplan_uuid = localRecord.routeplan_uuid;
        if (localRecord.pos_uuid)       localFkOverride.pos_uuid       = localRecord.pos_uuid;
      }
      if (entityType === 'posformItem') {
        if (localRecord.posform_uuid)   localFkOverride.posform_uuid   = localRecord.posform_uuid;
      }
    }

    await table.where('uuid').equals(uuid).modify({
      ...serverData,
      ...localFkOverride, // ← FK locales prioritaires sur serverData
      uuid,               // ← UUID toujours préservé
      sync_status: 'synced'
    });
  }

  /**
   * Delete local entity after successful server deletion
   */
  private async deleteLocalEntity(
    entityType: string,
    uuid: string
  ): Promise<void> {
    const table = this.getTableForEntity(entityType);
    if (!table) return;

    await table.where('uuid').equals(uuid).delete();
  }

  /**
   * Get IndexedDB table for entity type
   */
  private getTableForEntity(entityType: string): any {
    switch (entityType) {
      case 'brand':
        return db.brands;
      case 'pos':
        return db.pos;
      case 'posform':
        return db.posForms;
      case 'posformItem':
        return db.posformItems;
      case 'routeplan':
        return db.routePlans;
      case 'routeplanItem':
        return db.routePlanItems;
      case 'posequipment':
        return db.posEquipments;
      default:
        return null;
    }
  }

  /**
   * Mark operation as completed
   */
  async markCompleted(id: number): Promise<void> {
    await db.syncQueue.update(id, {
      status: 'completed'
    });
  }

  /**
   * Mark operation as failed
   */
  async markFailed(id: number, errorMessage: string): Promise<void> {
    const operation = await db.syncQueue.get(id);
    if (operation) {
      await db.syncQueue.update(id, {
        status: 'failed',
        errorMessage,
        retryCount: (operation.retryCount || 0) + 1
      });
    }
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations(): Promise<void> {
    const failedOps = await db.syncQueue
      .where('status')
      .equals('failed')
      .and(op => (op.retryCount || 0) < 3) // Max 3 retries
      .toArray();

    for (const op of failedOps) {
      await db.syncQueue.update(op.id!, { status: 'pending' });
    }

    await this.updatePendingCount();
  }

  /**
   * Clear completed operations older than 24 hours
   */
  async clearOldCompletedOperations(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    await db.syncQueue
      .where('status')
      .equals('completed')
      .and(op => op.timestamp < oneDayAgo)
      .delete();
  }

  /**
   * Get all operations (for debugging)
   */
  async getAllOperations(): Promise<QueuedOperation[]> {
    return await db.syncQueue.toArray();
  }

  /**
   * Clear all operations (for debugging)
   */
  async clearAllOperations(): Promise<void> {
    await db.syncQueue.clear();
    await this.updatePendingCount();
  }

  /**
   * Delete a specific operation
   */
  async deleteOperation(id: number): Promise<void> {
    await db.syncQueue.delete(id);
    await this.updatePendingCount();
  }

  /**
   * Annule toutes les opérations en attente (pending) liées à une entité donnée.
   * Utilisé pour éviter les créations fantômes quand on supprime un item jamais synchronisé.
   */
  async cancelPendingOperationsForEntity(entityType: string, uuid: string): Promise<number> {
    const ops = await db.syncQueue
      .where('status').equals('pending')
      .filter(op => op.entityType === entityType && (op.tempId === uuid || op.data?.uuid === uuid))
      .toArray();

    for (const op of ops) {
      if (op.id != null) await db.syncQueue.delete(op.id);
    }

    await this.updatePendingCount();
    console.log(`🗑️ ${ops.length} opération(s) annulée(s) pour ${entityType} uuid=${uuid}`);
    return ops.length;
  }
}
