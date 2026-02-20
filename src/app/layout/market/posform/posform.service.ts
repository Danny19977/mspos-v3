import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiResponse2 } from '../../../shared/model/api-response.model';
import { IUser } from '../../management/user/models/user.model';
import { IPosForm } from './models/posform.model';
import { NetworkService } from '../../../services/network.service';
import { SyncQueueService } from '../../../shared/services/sync-queue.service';
import { db } from '../../../shared/services/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * PosformService - Mode OFFLINE FIRST
 * 
 * - Les Posforms sont stockés localement et accessibles hors ligne
 * - Les opérations CRUD se font d'abord en local
 * - La synchronisation avec le serveur se fait en arrière-plan
 * - En mode offline, les opérations sont mises en file d'attente
 */
@Injectable({
  providedIn: 'root'
})
export class PosformService extends ApiService {
  endpoint: string = `${environment.apiUrl}/posforms`;
  
  // Modern Angular inject pattern
  private networkService = inject(NetworkService);
  private syncQueue = inject(SyncQueueService);

  getPaginatedRangeDateByUserUUID(uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string
  ): Observable<ApiResponse2> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<ApiResponse2>(`${this.endpoint}/all/paginate/user/${uuid}`, { params });
  }

  /**
   * Récupère les posforms avec filtres avancés
   * Utilise l'endpoint optimisé du backend Go Fiber avec tous les filtres disponibles
   */
  getPaginatedWithAdvancedFilters(
    currentUser: IUser,
    page: number,
    pageSize: number,
    startDate: string,
    endDate: string,
    filters: any = {}
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString())
      .set('start_date', startDate)
      .set('end_date', endDate);

    // Filtres supportés par le backend (ApplyCommonFilters)
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.price) {
      params = params.set('price', filters.price);
    }
    if (filters.asm) {
      params = params.set('asm', filters.asm);
    }
    // Note: champ backend = "sup" (pas "supervisor")
    if (filters.supervisor) {
      params = params.set('sup', filters.supervisor);
    }
    if (filters.dr) {
      params = params.set('dr', filters.dr);
    }
    if (filters.cyclo) {
      params = params.set('cyclo', filters.cyclo);
    }

    if (currentUser.role == 'Manager' || currentUser.role == 'Support') {
      console.log("Manager or Support user detected, fetching by country");
      // return this.http.get<any>(`${this.endpoint}/all/paginate/country/${currentUser.country_uuid}`, { params });
      return this.http.get<any>(`${this.endpoint}/all/paginate`, { params });

    } else if (currentUser.role == 'ASM') {
      console.log("ASM user detected, fetching by country");
      return this.http.get<any>(`${this.endpoint}/all/paginate/province/${currentUser.province_uuid}`, { params });

    } else if (currentUser.role == 'Supervisor') {
      console.log("Supervisor user detected, fetching by area");
      return this.http.get<any>(`${this.endpoint}/all/paginate/area/${currentUser.area_uuid}`, { params });

    } else if (currentUser.role == 'DR') {
      console.log("DR user detected, fetching by subarea");
      return this.http.get<any>(`${this.endpoint}/all/paginate/subarea/${currentUser.sub_area_uuid}`, { params });

    } else if (currentUser.role == 'Cyclo') {
      console.log("Cyclo user detected, fetching by commune");
      return this.http.get<any>(`${this.endpoint}/all/paginate/commune/${currentUser.uuid}`, { params });

    } else {
      return this.http.get<any>(`${this.endpoint}/all/paginate`, { params });
    }
  }

  getPaginatedWithAdvancedFilters2(
    name: string,
    territoire_uuid: string,
    page: number,
    pageSize: number,
    startDate: string,
    endDate: string,
    filters: any = {}
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString())
      .set('start_date', startDate)
      .set('end_date', endDate);

    // Filtres supportés par le backend (ApplyCommonFilters)
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.price) {
      params = params.set('price', filters.price);
    }
    if (filters.asm) {
      params = params.set('asm', filters.asm);
    }
    // Note: champ backend = "sup" (pas "supervisor")
    if (filters.supervisor) {
      params = params.set('sup', filters.supervisor);
    }
    if (filters.dr) {
      params = params.set('dr', filters.dr);
    }
    if (filters.cyclo) {
      params = params.set('cyclo', filters.cyclo);
    }

    if (name == "country" || name == 'Manager' || name == 'Support') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/country/${territoire_uuid}`, { params });

    } else if (name == 'province' || name == 'ASM') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/province/${territoire_uuid}`, { params });

    } else if (name == 'area' || name == 'Supervisor') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/area/${territoire_uuid}`, { params });

    } else if (name == 'subarea' || name == 'DR') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/subarea/${territoire_uuid}`, { params });

    } else if (name == 'commune' || name == 'Cyclo') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/commune-filter/${territoire_uuid}`, { params });
    } else {
      return this.http.get<any>(`${this.endpoint}/all/paginate`, { params });
    }
  }

  /**
   * Méthodes héritées mises à jour pour utiliser les bons noms de paramètres de l'API
   */
  override getPaginatedRangeDate2(page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string
  ): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate`, { params });
  }

  getPaginatedRangeDateByCountryUUID(country_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/country/${country_uuid}`, { params });
  }

  override getPaginatedRangeDateByProvinceId(province_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/province/${province_uuid}`, { params });
  }

  override getPaginatedRangeDateByAreaId(area_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/area/${area_uuid}`, { params });
  }

  override getPaginatedRangeDateBySubAreaId(sub_area_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/subarea/${sub_area_uuid}`, { params });
  }

  override getPaginatedRangeDateByCommuneId(user_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/commune/${user_uuid}`, { params });
  }

  /**
   * Exporte les données PosForm en Excel via l'API backend
   * Utilise l'endpoint GET /posforms/export/excel
   */
  exportExcel(filters: any = {}, startDate: string = '', endDate: string = ''): Observable<Blob> {
    let params = new HttpParams();

    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.country) params = params.set('country', filters.country);
    if (filters.province) params = params.set('province', filters.province);
    if (filters.area) params = params.set('area', filters.area);
    if (filters.subarea) params = params.set('subarea', filters.subarea);
    if (filters.commune) params = params.set('commune', filters.commune);
    if (filters.price) params = params.set('price', filters.price);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.posType) params = params.set('posType', filters.posType);
    if (filters.posSearch) params = params.set('posSearch', filters.posSearch);
    if (filters.asm) params = params.set('asm', filters.asm);
    if (filters.supervisor) params = params.set('supervisor', filters.supervisor);
    if (filters.dr) params = params.set('dr', filters.dr);
    if (filters.cyclo) params = params.set('cyclo', filters.cyclo);

    return this.http.get(`${this.endpoint}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Crée un nouveau Posform - OFFLINE FIRST
   */
  override create(data: IPosForm): Observable<any> {
    const tempUuid = uuidv4();
    const posformData: IPosForm = {
      ...data,
      uuid: tempUuid,
      sync_status: 'pending',
      temp_id: tempUuid,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };

    return from(this.createPosformLocally(posformData)).pipe(
      switchMap(async (localPosform) => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'posform',
          operation: 'create',
          endpoint: `${this.endpoint}/create`,
          data: posformData,
          tempId: tempUuid,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
          userId: data.user_uuid
        });

        console.log('✅ Posform créé localement et mis en file de synchronisation');
        
        return {
          data: localPosform,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'Posform créé, synchronisation en cours...' 
            : 'Posform créé localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Met à jour un Posform - OFFLINE FIRST
   */
  override update(uuid: string, data: Partial<IPosForm>): Observable<any> {
    const posformData: Partial<IPosForm> = {
      ...data,
      uuid,
      sync_status: 'pending',
      UpdatedAt: new Date()
    };

    return from(this.updatePosformLocally(uuid, posformData)).pipe(
      switchMap(async (updatedPosform) => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'posform',
          operation: 'update',
          endpoint: `${this.endpoint}/update/${uuid}`,
          data: posformData,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
          userId: data.user_uuid
        });

        console.log('✅ Posform modifié localement et mis en file de synchronisation');
        
        return {
          data: updatedPosform,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'Posform modifié, synchronisation en cours...' 
            : 'Posform modifié localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Supprime un Posform - OFFLINE FIRST
   */
  override delete(uuid: string): Observable<any> {
    return from(this.markPosformAsDeleted(uuid)).pipe(
      switchMap(async () => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'posform',
          operation: 'delete',
          endpoint: `${this.endpoint}/delete/${uuid}`,
          data: { uuid },
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending'
        });

        console.log('✅ Posform marqué comme supprimé et mis en file de synchronisation');
        
        return {
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline()
            ? 'Posform supprimé, synchronisation en cours...'
            : 'Posform supprimé localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Crée un Posform en local (IndexedDB)
   */
  private async createPosformLocally(data: IPosForm): Promise<IPosForm> {
    const id = await db.posForms.add({
      uuid: data.uuid!,
      price: data.price,
      comment: data.comment,
      latitude: data.latitude,
      longitude: data.longitude,
      pos_uuid: data.pos_uuid,
      user_uuid: data.user_uuid,
      country_uuid: data.country_uuid,
      province_uuid: data.province_uuid,
      area_uuid: data.area_uuid,
      sub_area_uuid: data.sub_area_uuid,
      commune_uuid: data.commune_uuid,
      asm_uuid: data.asm_uuid,
      asm: data.asm,
      sup_uuid: data.sup_uuid,
      sup: data.sup,
      dr_uuid: data.dr_uuid,
      dr: data.dr,
      cyclo_uuid: data.cyclo_uuid,
      cyclo: data.cyclo,
      signature: data.signature,
      sync_status: data.sync_status,
      temp_id: data.temp_id,
      CreatedAt: data.CreatedAt,
      UpdatedAt: data.UpdatedAt
    } as any);

    console.log(`💾 Posform créé localement avec ID: ${id}`);
    return { ...data, id } as IPosForm;
  }

  /**
   * Met à jour un Posform en local (IndexedDB)
   */
  private async updatePosformLocally(uuid: string, data: Partial<IPosForm>): Promise<Partial<IPosForm>> {
    // Utiliser as any pour éviter les références circulaires avec Dexie
    await (db.posForms.where('uuid').equals(uuid) as any).modify({
      price: data.price,
      comment: data.comment,
      latitude: data.latitude,
      longitude: data.longitude,
      pos_uuid: data.pos_uuid,
      signature: data.signature,
      sync_status: data.sync_status,
      UpdatedAt: data.UpdatedAt
    });

    console.log(`💾 Posform ${uuid} mis à jour localement`);
    return data;
  }

  /**
   * Marque un Posform comme supprimé en local
   */
  private async markPosformAsDeleted(uuid: string): Promise<void> {
    // Utiliser as any pour éviter les références circulaires avec Dexie
    await (db.posForms.where('uuid').equals(uuid) as any).modify({
      sync_status: 'pending'
    });

    console.log(`💾 Posform ${uuid} marqué comme supprimé`);
  }

  /**
   * Récupère les Posforms depuis le cache local
   */
  async getFromLocalCache(filters: any = {}): Promise<IPosForm[]> {
    let collection = db.posForms.toCollection();
    
    // Appliquer les filtres
    if (filters.user_uuid) {
      collection = db.posForms.where('cyclo_uuid').equals(filters.user_uuid);
    }
    
    const posforms = await collection.toArray();
    console.log(`📦 ${posforms.length} Posforms récupérés du cache local`);
    return posforms;
  }

  /**
   * Met à jour le cache local avec les données du serveur
   */
  async updateLocalCache(posforms: IPosForm[]): Promise<void> {
    try {
      const posformsToStore = posforms.map(pf => ({
        uuid: pf.uuid!,
        price: pf.price,
        comment: pf.comment,
        latitude: pf.latitude,
        longitude: pf.longitude,
        pos_uuid: pf.pos_uuid,
        user_uuid: pf.user_uuid,
        country_uuid: pf.country_uuid,
        province_uuid: pf.province_uuid,
        area_uuid: pf.area_uuid,
        sub_area_uuid: pf.sub_area_uuid,
        commune_uuid: pf.commune_uuid,
        asm_uuid: pf.asm_uuid,
        asm: pf.asm,
        sup_uuid: pf.sup_uuid,
        sup: pf.sup,
        dr_uuid: pf.dr_uuid,
        dr: pf.dr,
        cyclo_uuid: pf.cyclo_uuid,
        cyclo: pf.cyclo,
        signature: pf.signature,
        sync_status: 'synced' as const,
        CreatedAt: pf.CreatedAt,
        UpdatedAt: pf.UpdatedAt
      }));
      
      await db.posForms.bulkPut(posformsToStore as any);
      console.log(`💾 ${posformsToStore.length} Posforms mis à jour dans le cache local`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache local:', error);
    }
  }

  /**
   * Retourne les Posforms du cache local paginés, filtrés par rôle utilisateur — OFFLINE FIRST
   */
  getPaginatedOfflineFirstByUser(
    currentUser: IUser,
    page: number,
    pageSize: number,
    startDate: string,
    endDate: string,
    filters: any = {}
  ): Observable<any> {
    const field = this.getRoleTerritoryField(currentUser);
    const uuid = this.getRoleTerritoryUuid(currentUser);
    return from(this.getFromLocalCacheFiltered(field, uuid, page, pageSize, startDate, endDate, filters));
  }

  /**
   * Retourne les Posforms du cache local paginés, filtrés par territoire — OFFLINE FIRST
   */
  getPaginatedOfflineFirstByTerritory(
    name: string,
    territoire_uuid: string,
    page: number,
    pageSize: number,
    startDate: string,
    endDate: string,
    filters: any = {}
  ): Observable<any> {
    const field = this.getFieldByTerritoireName(name);
    return from(this.getFromLocalCacheFiltered(field, territoire_uuid, page, pageSize, startDate, endDate, filters));
  }

  private getRoleTerritoryField(user: IUser): string {
    switch (user.role) {
      case 'Manager': case 'Support': return 'country_uuid';
      case 'ASM': return 'province_uuid';
      case 'Supervisor': return 'area_uuid';
      case 'DR': return 'sub_area_uuid';
      case 'Cyclo': return 'cyclo_uuid';
      default: return '';
    }
  }

  private getRoleTerritoryUuid(user: IUser): string {
    switch (user.role) {
      case 'Manager': case 'Support': return user.country_uuid ?? '';
      case 'ASM': return user.province_uuid ?? '';
      case 'Supervisor': return user.area_uuid ?? '';
      case 'DR': return user.sub_area_uuid ?? '';
      case 'Cyclo': return user.uuid;
      default: return '';
    }
  }

  private getFieldByTerritoireName(name: string): string {
    switch (name) {
      case 'country': case 'Manager': case 'Support': return 'country_uuid';
      case 'province': case 'ASM': return 'province_uuid';
      case 'area': case 'Supervisor': return 'area_uuid';
      case 'subarea': case 'DR': return 'sub_area_uuid';
      case 'commune': case 'Cyclo': return 'commune_uuid';
      default: return '';
    }
  }

  private async getFromLocalCacheFiltered(
    territoryField: string,
    territoryUuid: string,
    page: number,
    pageSize: number,
    startDate: string,
    endDate: string,
    filters: any = {}
  ): Promise<any> {
    let posforms: IPosForm[];

    if (territoryField && territoryUuid) {
      posforms = await (db.posForms.where(territoryField as any).equals(territoryUuid) as any).toArray();
    } else {
      posforms = await db.posForms.toCollection().toArray();
    }

    // Filtrer par plage de dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    posforms = posforms.filter(pf => {
      if (!pf.CreatedAt) return true;
      const d = new Date(pf.CreatedAt);
      return d >= start && d <= end;
    });

    // Filtrer par recherche
    if (filters.search) {
      const s = filters.search.toLowerCase();
      posforms = posforms.filter(pf =>
        (pf.comment || '').toLowerCase().includes(s) ||
        (pf.cyclo || '').toLowerCase().includes(s) ||
        (pf.asm || '').toLowerCase().includes(s)
      );
    }

    // Trier par date décroissante
    posforms.sort((a, b) => {
      const da = a.CreatedAt ? new Date(a.CreatedAt).getTime() : 0;
      const db2 = b.CreatedAt ? new Date(b.CreatedAt).getTime() : 0;
      return db2 - da;
    });

    const total_records = posforms.length;
    const total_pages = Math.max(1, Math.ceil(total_records / pageSize));
    const offset = (page - 1) * pageSize;
    const paginated = posforms.slice(offset, offset + pageSize);

    console.log(`📦 Posforms locaux: ${total_records} total, page ${page}/${total_pages}`);
    return {
      data: paginated,
      pagination: {
        total_pages,
        total_records,
        current_page: page,
        page_size: pageSize
      },
      offline: true
    };
  }
}
