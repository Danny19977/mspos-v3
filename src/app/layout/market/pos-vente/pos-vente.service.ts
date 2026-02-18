import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { IUser } from '../../management/user/models/user.model';
import { NetworkService } from '../../../services/network.service';
import { SyncQueueService } from '../../../shared/services/sync-queue.service';
import { db } from '../../../shared/services/db';
import { IPos } from './models/pos.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * PosVenteService - Mode OFFLINE FIRST
 * 
 * - Les POS sont stockés localement et accessibles hors ligne
 * - Les opérations CRUD se font d'abord en local
 * - La synchronisation avec le serveur se fait en arrière-plan
 * - En mode offline, les opérations sont mises en file d'attente
 */
@Injectable({
  providedIn: 'root'
})
export class PosVenteService extends ApiService {
  endpoint: string = `${environment.apiUrl}/pos`;

  constructor(
    protected override http: HttpClient,
    protected override injector: Injector,
    private networkService: NetworkService,
    private syncQueue: SyncQueueService
  ) {
    super(http, injector);
  }

  getAllAreaById(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all-area/${uuid}`);
  }

  /**
   * Récupère les POS avec filtres avancés - OFFLINE FIRST
   * Affiche toujours les données locales en premier pour une meilleure UX
   */
  getPaginatedWithAdvancedFilters(
    currentUser: IUser,
    page: number,
    pageSize: number,
    filters: any = {}
  ): Observable<any> {
    // Toujours retourner les données locales en premier (offline-first)
    return from(this.getFromLocalCacheWithFilters(currentUser, filters)).pipe(
      tap(localData => {
        // Si online, synchroniser en arrière-plan sans bloquer l'affichage
        if (this.networkService.isOnline()) {
          this.syncPosInBackground(currentUser, page, pageSize, filters);
        }
      })
    );
  }

  /**
   * Synchronise les POS en arrière-plan (ne bloque pas l'affichage)
   */
  private syncPosInBackground(
    currentUser: IUser,
    page: number,
    pageSize: number,
    filters: any = {}
  ): void {
    let params = this.buildFilterParams(page, pageSize, filters);
    let url: string;

    if (currentUser.role == 'ASM') {
      url = `${this.endpoint}/all/paginate/province/${currentUser.province_uuid}?${params.toString()}`;
    } else if (currentUser.role == 'Supervisor') {
      url = `${this.endpoint}/all/paginate/area/${currentUser.area_uuid}?${params.toString()}`;
    } else if (currentUser.role == 'DR') {
      url = `${this.endpoint}/all/paginate/subarea/${currentUser.sub_area_uuid}?${params.toString()}`;
    } else if (currentUser.role == 'Cyclo') {
      url = `${this.endpoint}/all/paginate/commune/${currentUser.uuid}?${params.toString()}`;
    } else {
      url = `${this.endpoint}/all/paginate?${params.toString()}`;
    }

    // Appeler le serveur en arrière-plan
    this.http.get<any>(url).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.updateLocalPosCache(response.data).then(() => {
            console.log('🔄 POS synchronisés en arrière-plan');
          });
        }
      },
      error: (error: any) => {
        console.log('⚠️ Erreur sync arrière-plan (non bloquant):', error.message);
      }
    });
  }

  /**
   * Récupère les POS depuis le cache local avec filtres
   */
  private async getFromLocalCacheWithFilters(
    currentUser: IUser,
    filters: any = {}
  ): Promise<any> {
    let collection = db.pos.toCollection();

    // Filtrage par rôle
    if (currentUser.role === 'ASM' && currentUser.province_uuid) {
      collection = db.pos.where('province_uuid').equals(currentUser.province_uuid);
    } else if (currentUser.role === 'Supervisor' && currentUser.area_uuid) {
      collection = db.pos.where('area_uuid').equals(currentUser.area_uuid);
    } else if (currentUser.role === 'DR' && currentUser.sub_area_uuid) {
      collection = db.pos.where('sub_area_uuid').equals(currentUser.sub_area_uuid);
    } else if (currentUser.role === 'Cyclo' && currentUser.commune_uuid) {
      collection = db.pos.where('commune_uuid').equals(currentUser.commune_uuid);
    }

    let posList = await collection.toArray();

    // Appliquer les filtres additionnels
    posList = this.applyFiltersToPosList(posList, filters);

    return {
      data: posList,
      total: posList.length,
      page: 1,
      page_size: posList.length,
      offline: !this.networkService.isOnline()
    };
  }

  /**
   * Applique les filtres à une liste de POS
   */
  private applyFiltersToPosList(posList: IPos[], filters: any): IPos[] {
    if (!filters) return posList;

    return posList.filter(pos => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          pos.name?.toLowerCase().includes(searchLower) ||
          pos.shop?.toLowerCase().includes(searchLower) ||
          pos.gerant?.toLowerCase().includes(searchLower) ||
          pos.telephone?.includes(filters.search) ||
          pos.quartier?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.country && pos.country_uuid !== filters.country) return false;
      if (filters.province && pos.province_uuid !== filters.province) return false;
      if (filters.area && pos.area_uuid !== filters.area) return false;
      if (filters.subarea && pos.sub_area_uuid !== filters.subarea) return false;
      if (filters.commune && pos.commune_uuid !== filters.commune) return false;
      
      if (filters.postype && pos.postype !== filters.postype) return false;
      if (filters.status !== undefined && pos.status !== filters.status) return false;
      if (filters.shop && !pos.shop?.toLowerCase().includes(filters.shop.toLowerCase())) return false;
      if (filters.name && !pos.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.gerant && !pos.gerant?.toLowerCase().includes(filters.gerant.toLowerCase())) return false;
      if (filters.telephone && !pos.telephone?.includes(filters.telephone)) return false;
      if (filters.quartier && !pos.quartier?.toLowerCase().includes(filters.quartier.toLowerCase())) return false;
      if (filters.avenue && !pos.avenue?.toLowerCase().includes(filters.avenue.toLowerCase())) return false;
      if (filters.reference && !pos.reference?.toLowerCase().includes(filters.reference.toLowerCase())) return false;

      return true;
    });
  }

  /**
   * Construit les paramètres de filtre pour les requêtes HTTP
   */
  private buildFilterParams(page: number, pageSize: number, filters: any = {}): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.country) params = params.set('country', filters.country);
    if (filters.province) params = params.set('province', filters.province);
    if (filters.area) params = params.set('area', filters.area);
    if (filters.subarea) params = params.set('subarea', filters.subarea);
    if (filters.commune) params = params.set('commune', filters.commune);
    if (filters.postype) params = params.set('postype', filters.postype);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.shop) params = params.set('shop', filters.shop);
    if (filters.name) params = params.set('name', filters.name);
    if (filters.gerant) params = params.set('gerant', filters.gerant);
    if (filters.telephone) params = params.set('telephone', filters.telephone);
    if (filters.quartier) params = params.set('quartier', filters.quartier);
    if (filters.avenue) params = params.set('avenue', filters.avenue);
    if (filters.reference) params = params.set('reference', filters.reference);
    if (filters.fullname) params = params.set('signature', filters.fullname);
    if (filters.asm) params = params.set('asm', filters.asm);
    if (filters.asmSearch) params = params.set('asmSearch', filters.asmSearch);
    if (filters.supervisor || filters.sup) params = params.set('supervisor', filters.supervisor || filters.sup);
    if (filters.supervisorSearch || filters.supSearch) params = params.set('supervisorSearch', filters.supervisorSearch || filters.supSearch);
    if (filters.dr) params = params.set('dr', filters.dr);
    if (filters.drSearch) params = params.set('drSearch', filters.drSearch);
    if (filters.cyclo) params = params.set('cyclo', filters.cyclo);
    if (filters.cycloSearch) params = params.set('cycloSearch', filters.cycloSearch);
    if (filters.sync !== undefined) params = params.set('sync', filters.sync.toString());
    if (filters.posformsCount) params = params.set('posformsCount', filters.posformsCount);

    return params;
  }

  /**
   * Deuxième méthode de pagination avec filtres
   */
  getPaginatedWithAdvancedFilters2(
    name: string,
    territoire_uuid: string,
    page: number,
    pageSize: number,
    filters: any = {}
  ): Observable<any> {
    // Retourner les données locales en premier
    return from(this.getFromLocalCacheByTerritory(name, territoire_uuid, filters)).pipe(
      tap(localData => {
        // Synchroniser en arrière-plan si online
        if (this.networkService.isOnline()) {
          this.syncPosByTerritoryInBackground(name, territoire_uuid, page, pageSize, filters);
        }
      })
    );
  }

  /**
   * Récupère depuis le cache local par territoire
   */
  private async getFromLocalCacheByTerritory(
    name: string,
    territoire_uuid: string,
    filters: any = {}
  ): Promise<any> {
    let collection = db.pos.toCollection();

    // Filtrage par territoire
    if (name === 'country' || name === 'Manager' || name === 'Support') {
      collection = db.pos.where('country_uuid').equals(territoire_uuid);
    } else if (name === 'province' || name === 'ASM') {
      collection = db.pos.where('province_uuid').equals(territoire_uuid);
    } else if (name === 'area' || name === 'Supervisor') {
      collection = db.pos.where('area_uuid').equals(territoire_uuid);
    } else if (name === 'subarea' || name === 'DR') {
      collection = db.pos.where('sub_area_uuid').equals(territoire_uuid);
    } else if (name === 'commune' || name === 'Cyclo') {
      collection = db.pos.where('commune_uuid').equals(territoire_uuid);
    }

    let posList = await collection.toArray();
    posList = this.applyFiltersToPosList(posList, filters);

    return {
      data: posList,
      total: posList.length,
      page: 1,
      page_size: posList.length,
      offline: !this.networkService.isOnline()
    };
  }

  /**
   * Synchronise en arrière-plan par territoire
   */
  private syncPosByTerritoryInBackground(
    name: string,
    territoire_uuid: string,
    page: number,
    pageSize: number,
    filters: any = {}
  ): void {
    let params = this.buildFilterParams(page, pageSize, filters);
    let url: string;

    if (name === 'country' || name === 'Manager' || name === 'Support') {
      url = `${this.endpoint}/all/paginate/country/${territoire_uuid}?${params.toString()}`;
    } else if (name === 'province' || name === 'ASM') {
      url = `${this.endpoint}/all/paginate/province/${territoire_uuid}?${params.toString()}`;
    } else if (name === 'area' || name === 'Supervisor') {
      url = `${this.endpoint}/all/paginate/area/${territoire_uuid}?${params.toString()}`;
    } else if (name === 'subarea' || name === 'DR') {
      url = `${this.endpoint}/all/paginate/subarea/${territoire_uuid}?${params.toString()}`;
    } else if (name === 'commune' || name === 'Cyclo') {
      url = `${this.endpoint}/all/paginate/commune-filter/${territoire_uuid}?${params.toString()}`;
    } else {
      url = `${this.endpoint}/all/paginate?${params.toString()}`;
    }

    this.http.get<any>(url).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.updateLocalPosCache(response.data).then(() => {
            console.log('🔄 POS synchronisés en arrière-plan (territoire)');
          });
        }
      },
      error: (error: any) => {
        console.log('⚠️ Erreur sync arrière-plan (non bloquant):', error.message);
      }
    });
  }

  /**
   * Crée un nouveau POS - OFFLINE FIRST
   */
  override create(data: IPos): Observable<any> {
    const tempUuid = uuidv4();
    const posData: IPos = {
      ...data,
      uuid: tempUuid,
      sync_status: this.networkService.isOnline() ? 'pending' : 'pending',
      temp_id: tempUuid,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };

    return from(this.createPosLocally(posData)).pipe(
      switchMap(async (localPos) => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'pos',
          operation: 'create',
          endpoint: this.endpoint,
          data: posData,
          tempId: tempUuid,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
          userId: data.user_uuid
        });

        console.log('✅ POS créé localement et mis en file de synchronisation');
        
        return {
          data: localPos,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'POS créé, synchronisation en cours...' 
            : 'POS créé localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Met à jour un POS - OFFLINE FIRST
   */
  override update(uuid: string, data: IPos): Observable<any> {
    const posData: IPos = {
      ...data,
      uuid,
      sync_status: 'pending',
      UpdatedAt: new Date()
    };

    return from(this.updatePosLocally(uuid, posData)).pipe(
      switchMap(async (updatedPos) => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'pos',
          operation: 'update',
          endpoint: `${this.endpoint}/${uuid}`,
          data: posData,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
          userId: data.user_uuid
        });

        console.log('✅ POS modifié localement et mis en file de synchronisation');
        
        return {
          data: updatedPos,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'POS modifié, synchronisation en cours...' 
            : 'POS modifié localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Supprime un POS - OFFLINE FIRST
   */
  override delete(uuid: string): Observable<any> {
    return from(this.markPosAsDeleted(uuid)).pipe(
      switchMap(async () => {
        // Mettre en file d'attente pour synchronisation
        await this.syncQueue.enqueue({
          operationId: uuidv4(),
          entityType: 'pos',
          operation: 'delete',
          endpoint: `${this.endpoint}/${uuid}`,
          data: { uuid },
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending'
        });

        console.log('✅ POS marqué comme supprimé et mis en file de synchronisation');
        
        return {
          success: true,
          offline: !this.networkService.isOnline(),
          message: this.networkService.isOnline() 
            ? 'POS supprimé, synchronisation en cours...' 
            : 'POS supprimé localement, sera synchronisé à la reconnexion'
        };
      })
    );
  }

  /**
   * Crée un POS en local
   */
  private async createPosLocally(pos: IPos): Promise<IPos> {
    await db.pos.add(pos);
    return pos;
  }

  /**
   * Met à jour un POS en local
   */
  private async updatePosLocally(uuid: string, pos: any): Promise<any> {
    // Utiliser as any pour éviter les références circulaires avec Dexie
    await (db.pos.where('uuid').equals(uuid) as any).modify({
      sync_status: 'pending',
      UpdatedAt: new Date()
    });
    return pos;
  }

  /**
   * Marque un POS comme supprimé (soft delete en local)
   */
  private async markPosAsDeleted(uuid: string): Promise<void> {
    // On peut soit supprimer directement, soit marquer comme deleted
    await db.pos.where('uuid').equals(uuid).delete();
  }

  /**
   * Met à jour le cache local des POS
   */
  private async updateLocalPosCache(posList: any[]): Promise<void> {
    try {
      const posToStore = posList.map((pos: any) => ({
        ...pos,
        sync_status: 'synced',
        id: pos.uuid
      }));
      await db.pos.bulkPut(posToStore as any);
      console.log(`💾 ${posToStore.length} POS mis à jour dans le cache local`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache POS:', error);
    }
  }

  /**
   * Google Maps
   */
  getGoogleMap(pos_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("start_date", start_date)
      .set("end_date", end_date);
    return this.http.get<any>(`${this.endpoint}/map-pos/${pos_uuid}`, { params });
  }
}

