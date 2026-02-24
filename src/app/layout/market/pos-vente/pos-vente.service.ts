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
   * Applique les filtres à une liste de POS (cache local)
   * Les filtres géographiques comparent par nom (cohérent avec le backend ILIKE)
   */
  private applyFiltersToPosList(posList: IPos[], filters: any): IPos[] {
    if (!filters) return posList;

    return posList.filter(pos => {
      // Recherche textuelle globale
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

      // Filtres géographiques par nom (ILIKE côté backend)
      if (filters.country) {
        const name = (pos as any).country_name || (pos as any).Country?.name || '';
        if (!name.toLowerCase().includes(filters.country.toLowerCase())) return false;
      }
      if (filters.province) {
        const name = (pos as any).province_name || (pos as any).Province?.name || '';
        if (!name.toLowerCase().includes(filters.province.toLowerCase())) return false;
      }
      if (filters.area) {
        const name = (pos as any).area_name || (pos as any).Area?.name || '';
        if (!name.toLowerCase().includes(filters.area.toLowerCase())) return false;
      }
      if (filters.subarea) {
        const name = (pos as any).subarea_name || (pos as any).sub_area_name || (pos as any).SubArea?.name || '';
        if (!name.toLowerCase().includes(filters.subarea.toLowerCase())) return false;
      }
      if (filters.commune) {
        const name = (pos as any).commune_name || (pos as any).Commune?.name || '';
        if (!name.toLowerCase().includes(filters.commune.toLowerCase())) return false;
      }

      // Filtre agent : cherche dans asm, sup, dr, cyclo simultanément
      if (filters.agent) {
        const agentLower = filters.agent.toLowerCase();
        const matchesAgent =
          pos.asm?.toLowerCase().includes(agentLower) ||
          pos.sup?.toLowerCase().includes(agentLower) ||
          pos.dr?.toLowerCase().includes(agentLower) ||
          pos.cyclo?.toLowerCase().includes(agentLower);
        if (!matchesAgent) return false;
      }

      return true;
    });
  }

  /**
   * Construit les paramètres de filtre pour les requêtes HTTP
   * Paramètres supportés par le backend : page, limit, search,
   * country, province, area, subarea, commune (par nom ILIKE), agent
   */
  private buildFilterParams(page: number, pageSize: number, filters: any = {}): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.country) params = params.set('country', filters.country);
    if (filters.province) params = params.set('province', filters.province);
    if (filters.area) params = params.set('area', filters.area);
    if (filters.subarea) params = params.set('subarea', filters.subarea);
    if (filters.commune) params = params.set('commune', filters.commune);
    if (filters.agent) params = params.set('agent', filters.agent);

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
   * Télécharge TOUS les POS autorisés depuis le cloud vers le cache local IndexedDB.
   * S'exécute page par page en arrière-plan sans bloquer l'interface.
   * Respecte les restrictions de territoire basées sur le rôle de l'utilisateur connecté.
   * À appeler une seule fois au chargement du composant (contrôlé par un flag dans le composant).
   */
  downloadAllCloudPosToLocal(currentUser: IUser): void {
    if (!this.networkService.isOnline()) return;

    const PAGE_SIZE = 200;

    const buildUrl = (page: number): string => {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('limit', PAGE_SIZE.toString());

      if (currentUser.role === 'ASM') {
        return `${this.endpoint}/all/paginate/province/${currentUser.province_uuid}?${params.toString()}`;
      } else if (currentUser.role === 'Supervisor') {
        return `${this.endpoint}/all/paginate/area/${currentUser.area_uuid}?${params.toString()}`;
      } else if (currentUser.role === 'DR') {
        return `${this.endpoint}/all/paginate/subarea/${currentUser.sub_area_uuid}?${params.toString()}`;
      } else if (currentUser.role === 'Cyclo') {
        return `${this.endpoint}/all/paginate/commune/${currentUser.uuid}?${params.toString()}`;
      } else {
        return `${this.endpoint}/all/paginate?${params.toString()}`;
      }
    };

    const downloadPage = (page: number) => {
      this.http.get<any>(buildUrl(page)).subscribe({
        next: (response: any) => {
          if (response?.data?.length) {
            this.updateLocalPosCache(response.data).then(() => {
              console.log(`📥 [downloadAllCloudPosToLocal] Page ${page}: ${response.data.length} POS stockés localement`);
              const totalPages: number = response.pagination?.total_pages ?? 1;
              if (page < totalPages) {
                downloadPage(page + 1);
              } else {
                console.log(`✅ [downloadAllCloudPosToLocal] Téléchargement terminé — ${response.pagination?.total_records ?? '?'} POS autorisés en cache local`);
              }
            });
          }
        },
        error: (error: any) => {
          console.warn(`⚠️ [downloadAllCloudPosToLocal] Erreur page ${page} (non bloquant):`, error.message);
        }
      });
    };

    downloadPage(1);
  }

  /**
   * Télécharge TOUS les POS d'un territoire depuis le cloud vers le cache local IndexedDB.
   * S'exécute page par page en arrière-plan sans bloquer l'interface.
   * Utilisé par PosFilterListComponent qui navigue par territoire (country/province/area/subarea/commune).
   * À appeler une seule fois au chargement du composant pour le territoire courant.
   */
  downloadAllCloudPosByTerritoryToLocal(name: string, territoire_uuid: string): void {
    if (!this.networkService.isOnline()) return;

    const PAGE_SIZE = 200;

    const buildUrl = (page: number): string => {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('limit', PAGE_SIZE.toString());

      if (name === 'country' || name === 'Manager' || name === 'Support') {
        return `${this.endpoint}/all/paginate/country/${territoire_uuid}?${params.toString()}`;
      } else if (name === 'province' || name === 'ASM') {
        return `${this.endpoint}/all/paginate/province/${territoire_uuid}?${params.toString()}`;
      } else if (name === 'area' || name === 'Supervisor') {
        return `${this.endpoint}/all/paginate/area/${territoire_uuid}?${params.toString()}`;
      } else if (name === 'subarea' || name === 'DR') {
        return `${this.endpoint}/all/paginate/subarea/${territoire_uuid}?${params.toString()}`;
      } else if (name === 'commune' || name === 'Cyclo') {
        return `${this.endpoint}/all/paginate/commune-filter/${territoire_uuid}?${params.toString()}`;
      } else {
        return `${this.endpoint}/all/paginate?${params.toString()}`;
      }
    };

    const downloadPage = (page: number) => {
      this.http.get<any>(buildUrl(page)).subscribe({
        next: (response: any) => {
          if (response?.data?.length) {
            this.updateLocalPosCache(response.data).then(() => {
              console.log(`📥 [downloadAllCloudPosByTerritoryToLocal] Page ${page}: ${response.data.length} POS stockés localement`);
              const totalPages: number = response.pagination?.total_pages ?? 1;
              if (page < totalPages) {
                downloadPage(page + 1);
              } else {
                console.log(`✅ [downloadAllCloudPosByTerritoryToLocal] Téléchargement terminé — ${response.pagination?.total_records ?? '?'} POS du territoire "${name}/${territoire_uuid}" en cache local`);
              }
            });
          }
        },
        error: (error: any) => {
          console.warn(`⚠️ [downloadAllCloudPosByTerritoryToLocal] Erreur page ${page} (non bloquant):`, error.message);
        }
      });
    };

    downloadPage(1);
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
          endpoint: `${this.endpoint}/create`,
          data: posData,
          tempId: tempUuid,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
          userId: data.user_uuid
        });

        // Déclencher la synchronisation immédiatement si en ligne
        if (this.networkService.isOnline()) {
          this.syncQueue.processQueue();
        }

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
          endpoint: `${this.endpoint}/update/${uuid}`,
          data: posData,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
          userId: data.user_uuid
        });

        // Déclencher la synchronisation immédiatement si en ligne
        if (this.networkService.isOnline()) {
          this.syncQueue.processQueue();
        }

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
          endpoint: `${this.endpoint}/delete/${uuid}`,
          data: { uuid },
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending'
        });

        // Déclencher la synchronisation immédiatement si en ligne
        if (this.networkService.isOnline()) {
          this.syncQueue.processQueue();
        }

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
        id: pos.uuid,
        // Normaliser les champs plats depuis les objets imbriqués
        area_name: pos.area_name || (typeof pos.Area?.name === 'string' ? pos.Area.name : '') || '',
        subarea_name: pos.subarea_name || (typeof pos.SubArea?.name === 'string' ? pos.SubArea.name : '') || '',
        province_name: pos.province_name || (typeof pos.Province?.name === 'string' ? pos.Province.name : '') || '',
        commune_name: pos.commune_name || (typeof pos.Commune?.name === 'string' ? pos.Commune.name : '') || '',
        country_name: pos.country_name || (typeof pos.Country?.name === 'string' ? pos.Country.name : '') || ''
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

  /**
   * Récupère les POS locaux en attente de synchronisation (sync_status === 'pending')
   * Utilisé pour afficher les données créées offline dans la liste principale
   */
  async getLocalPendingPos(userId: string): Promise<IPos[]> {
    try {
      const posList = await db.pos
        .where('user_uuid')
        .equals(userId)
        .filter(pos => pos.sync_status === 'pending')
        .toArray();

      // Trier par date décroissante (plus récent en premier)
      posList.sort((a, b) =>
        new Date((b as any).CreatedAt || 0).getTime() - new Date((a as any).CreatedAt || 0).getTime()
      );

      return posList;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des POS locaux:', error);
      return [];
    }
  }
}

