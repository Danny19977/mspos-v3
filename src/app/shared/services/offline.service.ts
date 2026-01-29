import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { NetworkService } from '../../services/network.service';
import { SyncQueueService } from './sync-queue.service';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

export interface OfflineRequestConfig {
  cacheResponse?: boolean; // Cache GET responses locally
  filterByProvince?: boolean; // Filter results by user province
  filterByArea?: boolean; // Filter results by user area
  filterByUser?: boolean; // Filter results by user
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  constructor(
    private http: HttpClient,
    private networkService: NetworkService,
    private syncQueue: SyncQueueService
  ) {}

  /**
   * Make HTTP request with offline support
   */
  request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config: OfflineRequestConfig = {}
  ): Observable<T> {
    if (this.networkService.isOnline()) {
      return this.onlineRequest<T>(method, url, data, config);
    } else {
      return this.offlineRequest<T>(method, url, data, config);
    }
  }

  /**
   * Handle online requests
   */
  private onlineRequest<T>(
    method: string,
    url: string,
    data?: any,
    config: OfflineRequestConfig = {}
  ): Observable<T> {
    let request$: Observable<any>;
    
    switch (method) {
      case 'GET':
        request$ = this.http.get<any>(url);
        break;
      case 'POST':
        request$ = this.http.post<any>(url, data);
        break;
      case 'PUT':
        request$ = this.http.put<any>(url, data);
        break;
      case 'DELETE':
        request$ = this.http.delete<any>(url);
        break;
      default:
        return throwError(() => new Error(`Unsupported method: ${method}`));
    }
    
    // Cache GET responses
    if (method === 'GET' && config.cacheResponse !== false) {
      return request$.pipe(
        switchMap(response => {
          return from(this.cacheResponse(url, response)).pipe(
            map(() => response as T)
          );
        }),
        catchError(error => {
          console.error('Online request failed, trying cache:', error);
          return from(this.getFromCache<T>(url, config));
        })
      );
    }
    
    return request$;
  }

  /**
   * Handle offline requests
   */
  private offlineRequest<T>(
    method: string,
    url: string,
    data?: any,
    config: OfflineRequestConfig = {}
  ): Observable<T> {
    console.log(`📴 Offline mode: ${method} ${url}`);
    
    if (method === 'GET') {
      return from(this.getFromCache<T>(url, config));
    } else {
      // Queue write operations
      return from(this.queueOperation(method, url, data));
    }
  }

  /**
   * Cache response to IndexedDB
   */
  private async cacheResponse(url: string, response: any): Promise<void> {
    const entityType = this.detectEntityType(url);
    const data = response?.data || response;
    
    if (!data || !entityType) return;
    
    try {
      switch (entityType) {
        case 'brand':
          if (Array.isArray(data)) {
            await db.brands.bulkPut(data.map(item => ({
              ...item,
              sync_status: 'synced'
            })));
          } else {
            await db.brands.put({ ...data, sync_status: 'synced' });
          }
          break;
          
        case 'pos':
          if (Array.isArray(data)) {
            await db.pos.bulkPut(data.map(item => ({
              ...item,
              sync_status: 'synced'
            })));
          } else {
            await db.pos.put({ ...data, sync_status: 'synced' });
          }
          break;
          
        case 'posform':
          if (Array.isArray(data)) {
            await db.posForms.bulkPut(data.map(item => ({
              ...item,
              sync_status: 'synced'
            })));
          } else {
            await db.posForms.put({ ...data, sync_status: 'synced' });
          }
          break;
          
        case 'posformItem':
          if (Array.isArray(data)) {
            await db.posformItems.bulkPut(data.map(item => ({
              ...item,
              sync_status: 'synced'
            })));
          } else {
            await db.posformItems.put({ ...data, sync_status: 'synced' });
          }
          break;
          
        case 'routeplan':
          if (Array.isArray(data)) {
            await db.routePlans.bulkPut(data.map(item => ({
              ...item,
              sync_status: 'synced'
            })));
          } else {
            await db.routePlans.put({ ...data, sync_status: 'synced' });
          }
          break;
          
        case 'routeplanItem':
          if (Array.isArray(data)) {
            await db.routePlanItems.bulkPut(data.map(item => ({
              ...item,
              sync_status: 'synced'
            })));
          } else {
            await db.routePlanItems.put({ ...data, sync_status: 'synced' });
          }
          break;
          
        case 'posequipment':
          if (Array.isArray(data)) {
            await db.posEquipments.bulkPut(data.map(item => ({
              ...item,
              sync_status: 'synced'
            })));
          } else {
            await db.posEquipments.put({ ...data, sync_status: 'synced' });
          }
          break;
      }
      
      console.log(`💾 Cached ${entityType} data locally`);
    } catch (error) {
      console.error(`Error caching ${entityType}:`, error);
    }
  }

  /**
   * Get data from cache
   */
  private async getFromCache<T>(url: string, config: OfflineRequestConfig = {}): Promise<T> {
    const entityType = this.detectEntityType(url);
    const currentUser = await this.getCurrentUser();
    
    if (!entityType) {
      throw new Error('Cannot determine entity type from URL');
    }
    
    try {
      let data: any;
      
      switch (entityType) {
        case 'brand':
          data = await this.queryBrands(url, currentUser, config);
          break;
        case 'pos':
          data = await this.queryPos(url, currentUser, config);
          break;
        case 'posform':
          data = await this.queryPosForms(url, currentUser, config);
          break;
        case 'posformItem':
          data = await this.queryPosFormItems(url);
          break;
        case 'routeplan':
          data = await this.queryRoutePlans(url, currentUser, config);
          break;
        case 'routeplanItem':
          data = await this.queryRoutePlanItems(url);
          break;
        case 'posequipment':
          data = await this.queryPosEquipments(url);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      console.log(`📦 Retrieved ${entityType} from cache`);
      return data as T;
    } catch (error) {
      console.error(`Error retrieving ${entityType} from cache:`, error);
      throw error;
    }
  }

  /**
   * Queue write operation for sync
   */
  private async queueOperation(method: string, url: string, data: any): Promise<any> {
    const entityType = this.detectEntityType(url);
    const currentUser = await this.getCurrentUser();
    
    if (!entityType) {
      throw new Error('Cannot determine entity type from URL');
    }
    
    const tempId = uuidv4();
    const operationData = {
      ...data,
      uuid: data.uuid || tempId,
      sync_status: 'pending',
      temp_id: tempId
    };
    
    const operation: any = {
      operationId: uuidv4(),
      entityType,
      operation: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
      endpoint: url,
      data: operationData,
      tempId: method === 'POST' ? tempId : undefined,
      userId: currentUser?.uuid
    };
    
    await this.syncQueue.enqueue(operation);
    
    // Optimistic local update
    await this.applyLocalOperation(operation);
    
    console.log(`🔄 Operation queued: ${method} ${entityType}`);
    
    // Return optimistic response
    return {
      data: operationData,
      offline: true,
      message: 'Operation queued for synchronization'
    };
  }

  /**
   * Apply operation locally for optimistic UI
   */
  private async applyLocalOperation(operation: any): Promise<void> {
    const table = this.getTableForEntity(operation.entityType);
    if (!table) return;
    
    switch (operation.operation) {
      case 'create':
        await table.add(operation.data);
        break;
      case 'update':
        await table.where('uuid').equals(operation.data.uuid).modify(operation.data);
        break;
      case 'delete':
        await table.where('uuid').equals(operation.data.uuid).delete();
        break;
    }
  }

  /**
   * Query brands from cache
   */
  private async queryBrands(url: string, currentUser: any, config: OfflineRequestConfig): Promise<any> {
    let query = db.brands.toCollection();
    
    // Filter by province for ASM and below
    if (currentUser && currentUser.province_uuid && config.filterByProvince !== false) {
      query = db.brands.where('province_uuid').equals(currentUser.province_uuid);
    }
    
    const brands = await query.toArray();
    
    // Return paginated format if URL suggests pagination
    if (url.includes('/paginate')) {
      return {
        data: brands,
        total: brands.length,
        page: 1,
        page_size: brands.length
      };
    }
    
    return { data: brands };
  }

  /**
   * Query POS from cache
   */
  private async queryPos(url: string, currentUser: any, config: OfflineRequestConfig): Promise<any> {
    let collection = db.pos.toCollection();
    
    // Apply role-based filtering
    if (currentUser) {
      if (currentUser.role === 'ASM' && currentUser.province_uuid) {
        collection = db.pos.where('province_uuid').equals(currentUser.province_uuid);
      } else if (currentUser.role === 'Supervisor' && currentUser.area_uuid) {
        collection = db.pos.where('area_uuid').equals(currentUser.area_uuid);
      } else if (currentUser.role === 'DR' && currentUser.sub_area_uuid) {
        collection = db.pos.where('sub_area_uuid').equals(currentUser.sub_area_uuid);
      } else if (currentUser.role === 'Cyclo' && currentUser.commune_uuid) {
        collection = db.pos.where('commune_uuid').equals(currentUser.commune_uuid);
      }
    }
    
    const pos = await collection.toArray();
    
    if (url.includes('/paginate')) {
      return {
        data: pos,
        total: pos.length,
        page: 1,
        page_size: pos.length
      };
    }
    
    return { data: pos };
  }

  /**
   * Query POS forms from cache
   */
  private async queryPosForms(url: string, currentUser: any, config: OfflineRequestConfig): Promise<any> {
    let collection = db.posForms.toCollection();
    
    // Filter by user if specified
    if (config.filterByUser && currentUser?.uuid) {
      collection = db.posForms.where('user_uuid').equals(currentUser.uuid);
    }
    
    const forms = await collection.toArray();
    
    if (url.includes('/paginate')) {
      return {
        data: forms,
        total: forms.length,
        page: 1,
        page_size: forms.length
      };
    }
    
    return { data: forms };
  }

  /**
   * Query POS form items from cache
   */
  private async queryPosFormItems(url: string): Promise<any> {
    const items = await db.posformItems.toArray();
    return { data: items };
  }

  /**
   * Query route plans from cache
   */
  private async queryRoutePlans(url: string, currentUser: any, config: OfflineRequestConfig): Promise<any> {
    let collection = db.routePlans.toCollection();
    
    if (currentUser?.uuid) {
      collection = db.routePlans.where('user_uuid').equals(currentUser.uuid);
    }
    
    const plans = await collection.toArray();
    
    if (url.includes('/paginate')) {
      return {
        data: plans,
        total: plans.length,
        page: 1,
        page_size: plans.length
      };
    }
    
    return { data: plans };
  }

  /**
   * Query route plan items from cache
   */
  private async queryRoutePlanItems(url: string): Promise<any> {
    const items = await db.routePlanItems.toArray();
    return { data: items };
  }

  /**
   * Query POS equipments from cache
   */
  private async queryPosEquipments(url: string): Promise<any> {
    const equipments = await db.posEquipments.toArray();
    return { data: equipments };
  }

  /**
   * Detect entity type from URL
   */
  private detectEntityType(url: string): string | null {
    if (url.includes('/brands')) return 'brand';
    if (url.includes('/pos-ventes') || url.includes('/pos')) return 'pos';
    if (url.includes('/posforms') && url.includes('/items')) return 'posformItem';
    if (url.includes('/posforms')) return 'posform';
    if (url.includes('/routeplan-items')) return 'routeplanItem';
    if (url.includes('/routeplans')) return 'routeplan';
    if (url.includes('/pos-equipements')) return 'posequipment';
    return null;
  }

  /**
   * Get table for entity type
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
   * Get current user from local storage
   */
  private async getCurrentUser(): Promise<any> {
    try {
      const LocalDbService = (await import('../../services/local-db.service')).LocalDbService;
      const localDb = new LocalDbService();
      const user = await localDb.getStoredUser();
      return user?.userData;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}
