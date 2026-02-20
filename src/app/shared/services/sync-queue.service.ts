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
          await this.syncOperation(operation);
          await this.markCompleted(operation.id!);
          successCount++;
          console.log(`✅ Synced: ${operation.operation} ${operation.entityType}`);
        } catch (error: any) {
          await this.markFailed(operation.id!, error.message || 'Unknown error');
          failedCount++;
          console.error(`❌ Failed to sync: ${operation.operation} ${operation.entityType}`, error);
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
        
        // Update local entity with server-generated UUID
        if (response?.data?.uuid && operation.tempId) {
          await this.updateLocalEntityId(
            operation.entityType,
            operation.tempId,
            response.data.uuid,
            response.data
          );
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
   * Update local entity with server-generated ID after creation
   */
  private async updateLocalEntityId(
    entityType: string,
    tempId: string,
    serverUuid: string,
    serverData: any
  ): Promise<void> {
    const table = this.getTableForEntity(entityType);
    if (!table) return;

    // Find entity by temp ID and update with server data
    const entity = await table.where('uuid').equals(tempId).first();
    if (entity) {
      await table.where('uuid').equals(tempId).modify({
        ...serverData,
        uuid: serverUuid,
        sync_status: 'synced',
        ID: serverData.ID || serverData.id
      });
      console.log(`🔄 Updated local ${entityType} ID: ${tempId} -> ${serverUuid}`);
    }
  }

  /**
   * Update local entity with server data after update
   */
  private async updateLocalEntity(
    entityType: string,
    uuid: string,
    serverData: any
  ): Promise<void> {
    const table = this.getTableForEntity(entityType);
    if (!table) return;

    await table.where('uuid').equals(uuid).modify({
      ...serverData,
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
}
