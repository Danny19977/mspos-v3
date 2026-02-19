import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
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
   * OFFLINE FIRST — Crée un RoutePlanItem localement et le met en file de sync
   */
  override create(data: IRoutePlanItem): Observable<any> {
    const tempUuid = uuidv4();
    const itemData: IRoutePlanItem = {
      ...data,
      uuid: tempUuid,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };

    if (this.networkService.isOnline()) {
      // Online : envoyer directement à l'API, sauvegarder en local comme synced
      return this.http.post<any>(`${this.endpoint}/create`, data).pipe(
        switchMap(async (res) => {
          const serverUuid = res?.data?.uuid || tempUuid;
          const record: any = { ...itemData, uuid: serverUuid, routplan_uuid: data.routeplan_uuid, sync_status: 'synced' };
          await db.routePlanItems.add(record);
          return { data: res?.data || itemData, offline: false };
        }),
        catchError(async (err) => {
          // Fallback offline : sauvegarder localement et mettre en file
          await this.createItemLocally(itemData);
          await this.syncQueue.enqueue({
            operationId: uuidv4(),
            entityType: 'routeplanItem',
            operation: 'create',
            endpoint: `${this.endpoint}/create`,
            data: itemData,
            tempId: tempUuid,
            timestamp: new Date(),
            retryCount: 0,
            status: 'pending',
          });
          return { data: itemData, offline: true };
        })
      );
    }

    // Offline : sauvegarder localement et mettre en file
    return from(this.createItemLocally(itemData)).pipe(
      switchMap(async () => {
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'routeplanItem',
          operation: 'create',
          endpoint: `${this.endpoint}/create`,
          data: itemData,
          tempId: tempUuid,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
        });
        return { data: itemData, offline: true };
      })
    );
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
