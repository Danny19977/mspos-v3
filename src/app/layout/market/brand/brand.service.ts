import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { NetworkService } from '../../../services/network.service';
import { db } from '../../../shared/services/db';
import { IBrand } from './models/brand.model';

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
