import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { NetworkService } from '../../../services/network.service';
import { db } from '../../../shared/services/db';
import { IBrand } from './models/brand.model';
import { IUser } from '../../management/user/models/user.model';

/**
 * BrandService - Mode ONLINE ONLY
 * 
 * - Les Brands sont téléchargés en local au démarrage pour consultation
 * - Les opérations CRUD (Create, Update, Delete) nécessitent une connexion Internet
 * - En mode offline, seule la lecture depuis le cache local est possible
 */
@Injectable({
  providedIn: 'root'
})
export class BrandService extends ApiService {
  endpoint: string = `${environment.apiUrl}/brands`;

  constructor(
    protected override http: HttpClient,
    protected override injector: Injector,
    private networkService: NetworkService
  ) {
    super(http, injector);
  }

  /**
   * Récupère tous les Brands
   * - Online: depuis le serveur (et met à jour le cache)
   * - Offline: depuis le cache local uniquement
   */
  getBrandsPaginated(page: number, pageSize: number, search: string): Observable<any> {
    if (this.networkService.isOnline()) {
      // Mode online: appeler le serveur et mettre à jour le cache
      return super.getPaginated2(page, pageSize, search).pipe(
        switchMap(async (response) => {
          // Mettre à jour le cache local avec les données du serveur
          if (response?.data) {
            await this.updateLocalCache(response.data);
          }
          return response;
        }),
        catchError(error => {
          console.log('📡 Erreur serveur, basculement sur cache local');
          return from(this.getFromLocalCache(search));
        })
      );
    } else {
      // Mode offline: lire depuis le cache local uniquement
      console.log('📴 Mode offline: lecture depuis cache local');
      return from(this.getFromLocalCache(search));
    }
  }

  /**
   * Récupère les Brands par province
   */
  getBrandsByProvinceId(province_uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    if (this.networkService.isOnline()) {
      return super.getPaginatedByProvinceId(province_uuid, page, pageSize, search).pipe(
        switchMap(async (response) => {
          if (response?.data) {
            await this.updateLocalCache(response.data);
          }
          return response;
        }),
        catchError(error => {
          console.log('📡 Erreur serveur, basculement sur cache local');
          return from(this.getFromLocalCacheByProvince(province_uuid, search));
        })
      );
    } else {
      console.log('📴 Mode offline: lecture depuis cache local');
      return from(this.getFromLocalCacheByProvince(province_uuid, search));
    }
  }

  /**
   * Crée un nouveau Brand - ONLINE ONLY
   */
  createBrand(data: IBrand): Observable<any> {
    if (!this.networkService.isOnline()) {
      return throwError(() => new Error('❌ Connexion Internet requise pour créer un Brand'));
    }
    return this.http.post(`${this.endpoint}`, data).pipe(
      switchMap(async (response: any) => {
        // Ajouter le nouveau Brand au cache local
        if (response?.data) {
          const brand = response.data;
          await db.brands.put({
            ID: brand.ID,
            id: brand.ID || brand.id,
            uuid: brand.uuid,
            name: brand.name,
            country_uuid: brand.country_uuid,
            province_uuid: brand.province_uuid,
            signature: brand.signature,
            CreatedAt: brand.CreatedAt,
            UpdatedAt: brand.UpdatedAt,
            sync_status: 'synced' as const,
            total_brand_usage: brand.total_brand_usage
          });
        }
        return response;
      })
    );
  }

  /**
   * Met à jour un Brand - ONLINE ONLY
   */
  updateBrand(uuid: string, data: IBrand): Observable<any> {
    if (!this.networkService.isOnline()) {
      return throwError(() => new Error('❌ Connexion Internet requise pour modifier un Brand'));
    }
    return this.http.put(`${this.endpoint}/${uuid}`, data).pipe(
      switchMap(async (response: any) => {
        // Mettre à jour le Brand dans le cache local
        if (response?.data) {
          const brand = response.data;
          await db.brands.put({
            ID: brand.ID,
            id: brand.ID || brand.id,
            uuid: brand.uuid,
            name: brand.name,
            country_uuid: brand.country_uuid,
            province_uuid: brand.province_uuid,
            signature: brand.signature,
            CreatedAt: brand.CreatedAt,
            UpdatedAt: brand.UpdatedAt,
            sync_status: 'synced' as const,
            total_brand_usage: brand.total_brand_usage
          });
        }
        return response;
      })
    );
  }

  /**
   * Supprime un Brand - ONLINE ONLY
   */
  deleteBrand(uuid: string): Observable<any> {
    if (!this.networkService.isOnline()) {
      return throwError(() => new Error('❌ Connexion Internet requise pour supprimer un Brand'));
    }
    return this.http.delete(`${this.endpoint}/${uuid}`).pipe(
      switchMap(async (response: any) => {
        // Supprimer du cache local
        await db.brands.where('uuid').equals(uuid).delete();
        return response;
      })
    );
  }

  /**
   * Récupère les Brands pour l'utilisateur - OFFLINE FIRST
   * Retourne immédiatement depuis le cache local IndexedDB.
   * Si en ligne, synchronise depuis le serveur en arrière-plan.
   * À utiliser dans PostformListComponent à la place de getAllByASM().
   */
  getBrandsOfflineFirst(provinceUuid?: string): Observable<any> {
    return from(
      provinceUuid
        ? this.getFromLocalCacheByProvince(provinceUuid, '')
        : this.getFromLocalCache('')
    ).pipe(
      tap(() => {
        if (this.networkService.isOnline()) {
          if (provinceUuid) {
            this.syncBrandsByProvinceInBackground(provinceUuid);
          } else {
            this.syncAllBrandsInBackground();
          }
        }
      })
    );
  }

  /**
   * Synchronise les Brands d'une province depuis le serveur en arrière-plan
   */
  private syncBrandsByProvinceInBackground(provinceUuid: string): void {
    this.http.get<any>(`${this.endpoint}/all/provinces/${provinceUuid}`).subscribe({
      next: (response: any) => {
        const data: any[] = response?.data ?? [];
        if (data.length) {
          this.updateLocalCache(data).then(() =>
            console.log(`🔄 [syncBrandsByProvinceInBackground] ${data.length} Brands synchronisés`)
          );
        }
      },
      error: (err: any) => {
        console.warn('⚠️ Sync brands province arrière-plan (non bloquant):', err.message);
      }
    });
  }

  /**
   * Synchronise tous les Brands depuis le serveur en arrière-plan
   */
  private syncAllBrandsInBackground(): void {
    this.http.get<any>(`${this.endpoint}/all`).subscribe({
      next: (response: any) => {
        const data: any[] = response?.data ?? [];
        if (data.length) {
          this.updateLocalCache(data).then(() =>
            console.log(`🔄 [syncAllBrandsInBackground] ${data.length} Brands synchronisés`)
          );
        }
      },
      error: (err: any) => {
        console.warn('⚠️ Sync brands arrière-plan (non bloquant):', err.message);
      }
    });
  }

  /**
   * Télécharge TOUS les Brands autorisés depuis le cloud vers le cache local IndexedDB.
   * S'exécute page par page en arrière-plan sans bloquer l'interface.
   * Respecte les restrictions de territoire basées sur le rôle de l'utilisateur connecté.
   */
  downloadAllCloudBrandsToLocal(currentUser: IUser): void {
    if (!this.networkService.isOnline()) return;

    const PAGE_SIZE = 200;

    const buildUrl = (page: number): string => {
      if (currentUser.role === 'ASM') {
        const params = new HttpParams()
          .set('page', page.toString())
          .set('page_size', PAGE_SIZE.toString());
        return `${this.endpoint}/all/paginate/province/${currentUser.province_uuid}?${params.toString()}`;
      } else {
        const params = new HttpParams()
          .set('page', page.toString())
          .set('limit', PAGE_SIZE.toString());
        return `${this.endpoint}/all/paginate?${params.toString()}`;
      }
    };

    const downloadPage = (page: number) => {
      this.http.get<any>(buildUrl(page)).subscribe({
        next: (response: any) => {
          if (response?.data?.length) {
            this.updateLocalCache(response.data).then(() => {
              console.log(`📥 [downloadAllCloudBrandsToLocal] Page ${page}: ${response.data.length} Brands stockés localement`);
              const totalPages: number = response.pagination?.total_pages ?? 1;
              if (page < totalPages) {
                downloadPage(page + 1);
              } else {
                console.log(`✅ [downloadAllCloudBrandsToLocal] Téléchargement terminé — ${response.pagination?.total_records ?? '?'} Brands autorisés en cache local`);
              }
            });
          }
        },
        error: (error: any) => {
          console.warn(`⚠️ [downloadAllCloudBrandsToLocal] Erreur page ${page} (non bloquant):`, error.message);
        }
      });
    };

    downloadPage(1);
  }

  /**
   * Télécharge TOUS les Brands d'un territoire depuis le cloud vers le cache local IndexedDB.
   * S'exécute page par page en arrière-plan sans bloquer l'interface.
   * Utilisé par BrandFilterListComponent qui navigue par territoire (country/province).
   */
  downloadAllCloudBrandsByTerritoryToLocal(name: string, territoire_uuid: string): void {
    if (!this.networkService.isOnline()) return;

    const PAGE_SIZE = 200;

    const buildUrl = (page: number): string => {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('page_size', PAGE_SIZE.toString());

      if (name === 'country') {
        return `${this.endpoint}/all/paginate/country/${territoire_uuid}?${params.toString()}`;
      } else if (name === 'province') {
        return `${this.endpoint}/all/paginate/province/${territoire_uuid}?${params.toString()}`;
      } else {
        const globalParams = new HttpParams()
          .set('page', page.toString())
          .set('limit', PAGE_SIZE.toString());
        return `${this.endpoint}/all/paginate?${globalParams.toString()}`;
      }
    };

    const downloadPage = (page: number) => {
      this.http.get<any>(buildUrl(page)).subscribe({
        next: (response: any) => {
          if (response?.data?.length) {
            this.updateLocalCache(response.data).then(() => {
              console.log(`📥 [downloadAllCloudBrandsByTerritoryToLocal] Page ${page}: ${response.data.length} Brands stockés localement`);
              const totalPages: number = response.pagination?.total_pages ?? 1;
              if (page < totalPages) {
                downloadPage(page + 1);
              } else {
                console.log(`✅ [downloadAllCloudBrandsByTerritoryToLocal] Téléchargement terminé — ${response.pagination?.total_records ?? '?'} Brands du territoire "${name}/${territoire_uuid}" en cache local`);
              }
            });
          }
        },
        error: (error: any) => {
          console.warn(`⚠️ [downloadAllCloudBrandsByTerritoryToLocal] Erreur page ${page} (non bloquant):`, error.message);
        }
      });
    };

    downloadPage(1);
  }

  /**
   * Met à jour le cache local avec les données du serveur
   */
  private async updateLocalCache(brands: IBrand[]): Promise<void> {
    try {
      const brandsToStore = brands.map(brand => ({
        ID: brand.ID,
        id: brand.ID || brand.id,
        uuid: brand.uuid,
        name: brand.name,
        country_uuid: brand.country_uuid,
        province_uuid: brand.province_uuid,
        signature: brand.signature,
        CreatedAt: brand.CreatedAt,
        UpdatedAt: brand.UpdatedAt,
        sync_status: 'synced' as const,
        total_brand_usage: brand.total_brand_usage
      }));
      await db.brands.bulkPut(brandsToStore);
      console.log(`💾 ${brandsToStore.length} Brands mis à jour dans le cache local`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache local:', error);
    }
  }

  /**
   * Récupère les Brands depuis le cache local
   */
  private async getFromLocalCache(search: string = ''): Promise<any> {
    let query = db.brands.toCollection();
    
    if (search) {
      query = db.brands.filter(brand => 
        brand.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const brands = await query.toArray();
    
    return {
      data: brands,
      total: brands.length,
      page: 1,
      page_size: brands.length,
      offline: true
    };
  }

  /**
   * Récupère les Brands par province depuis le cache local
   */
  private async getFromLocalCacheByProvince(province_uuid: string, search: string = ''): Promise<any> {
    let query = db.brands.where('province_uuid').equals(province_uuid);
    
    let brands = await query.toArray();
    
    if (search) {
      brands = brands.filter(brand => 
        brand.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return {
      data: brands,
      total: brands.length,
      page: 1,
      page_size: brands.length,
      offline: true
    };
  }
}
