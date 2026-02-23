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
 *
 * Stratégie de synchronisation :
 * - TTL de 24 h par clé territoire : on ne re-télécharge que si le cache est périmé
 * - Upsert basé sur `uuid` pour éviter les doublons (la clé primaire `++id` de Dexie
 *   est locale ; on mappe uuid ↔ id avant chaque bulkPut)
 * - Format de réponse unifié (pagination) entre online et offline
 */
@Injectable({
  providedIn: 'root'
})
export class BrandService extends ApiService {
  endpoint: string = `${environment.apiUrl}/brands`;

  /** TTL en millisecondes : 24 heures — les brands changent rarement */
  private static readonly SYNC_TTL_MS = 24 * 60 * 60 * 1000;
  private static readonly SYNC_KEY_PREFIX = 'brand_sync_ts_';

  /** Guard anti-concurrence pour syncBrandsByProvinceInBackground */
  private _syncingProvinces = new Set<string>();
  private _syncingAll = false;

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
    return this.http.post(`${this.endpoint}/create`, data).pipe(
      switchMap(async (response: any) => {
        // Ajouter le nouveau Brand au cache local via updateLocalCache (anti-doublon)
        if (response?.data) {
          await this.updateLocalCache([response.data]);
          // Invalider le TTL du territoire concerné pour forcer une resync propre
          if (response.data.country_uuid) {
            this.invalidateSyncCache(`country_${response.data.country_uuid}`);
          }
          if (response.data.province_uuid) {
            this.invalidateSyncCache(`province_${response.data.province_uuid}`);
          }
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
    return this.http.put(`${this.endpoint}/update/${uuid}`, data).pipe(
      switchMap(async (response: any) => {
        // Mettre à jour le Brand dans le cache local via updateLocalCache (anti-doublon)
        if (response?.data) {
          await this.updateLocalCache([response.data]);
          if (response.data.country_uuid) {
            this.invalidateSyncCache(`country_${response.data.country_uuid}`);
          }
          if (response.data.province_uuid) {
            this.invalidateSyncCache(`province_${response.data.province_uuid}`);
          }
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
    return this.http.delete(`${this.endpoint}/delete/${uuid}`).pipe(
      switchMap(async (response: any) => {
        // Récupérer le brand local avant suppression pour invalider le bon TTL
        const existing = await db.brands.where('uuid').equals(uuid).first();
        await db.brands.where('uuid').equals(uuid).delete();
        if (existing?.country_uuid) {
          this.invalidateSyncCache(`country_${existing.country_uuid}`);
        }
        if (existing?.province_uuid) {
          this.invalidateSyncCache(`province_${existing.province_uuid}`);
        }
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
    // Nettoyage unique des doublons résiduels en IndexedDB
    this.purgeLocalDuplicates();

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
    if (this._syncingProvinces.has(provinceUuid)) return; // déjà en cours
    this._syncingProvinces.add(provinceUuid);

    this.http.get<any>(`${this.endpoint}/all/provinces/${provinceUuid}`).subscribe({
      next: (response: any) => {
        this._syncingProvinces.delete(provinceUuid);
        const data: any[] = response?.data ?? [];
        if (data.length) {
          this.updateLocalCache(data).then(() =>
            console.log(`🔄 [syncBrandsByProvinceInBackground] ${data.length} Brands synchronisés`)
          );
        }
      },
      error: (err: any) => {
        this._syncingProvinces.delete(provinceUuid);
        console.warn('⚠️ Sync brands province arrière-plan (non bloquant):', err.message);
      }
    });
  }

  /**
   * Synchronise tous les Brands depuis le serveur en arrière-plan
   */
  private syncAllBrandsInBackground(): void {
    if (this._syncingAll) return; // déjà en cours
    this._syncingAll = true;

    this.http.get<any>(`${this.endpoint}/all`).subscribe({
      next: (response: any) => {
        this._syncingAll = false;
        const data: any[] = response?.data ?? [];
        if (data.length) {
          this.updateLocalCache(data).then(() =>
            console.log(`🔄 [syncAllBrandsInBackground] ${data.length} Brands synchronisés`)
          );
        }
      },
      error: (err: any) => {
        this._syncingAll = false;
        console.warn('⚠️ Sync brands arrière-plan (non bloquant):', err.message);
      }
    });
  }

  // ─── TTL helpers ─────────────────────────────────────────────────────────────

  /**
   * Indique si la synchronisation pour une clé donnée (territoire) est périmée.
   * Renvoie `true` si le cache est vide ou que le TTL de 24 h est dépassé.
   */
  private isSyncExpired(key: string): boolean {
    const raw = localStorage.getItem(BrandService.SYNC_KEY_PREFIX + key);
    if (!raw) return true;
    const lastSyncTs = parseInt(raw, 10);
    return Date.now() - lastSyncTs > BrandService.SYNC_TTL_MS;
  }

  /** Enregistre l'horodatage de la dernière synchronisation pour une clé. */
  private markSynced(key: string): void {
    localStorage.setItem(BrandService.SYNC_KEY_PREFIX + key, Date.now().toString());
  }

  /**
   * Force la prochaine synchronisation d'une clé (utile après un Create/Update/Delete).
   */
  invalidateSyncCache(key: string): void {
    localStorage.removeItem(BrandService.SYNC_KEY_PREFIX + key);
  }

  // ─── Download methods ─────────────────────────────────────────────────────────

  /**
   * Télécharge TOUS les Brands autorisés depuis le cloud vers le cache local IndexedDB.
   * S'exécute page par page en arrière-plan sans bloquer l'interface.
   * Respecte un TTL de 24 h : si le cache est encore frais, aucun téléchargement n'est lancé.
   */
  downloadAllCloudBrandsToLocal(currentUser: IUser): void {
    if (!this.networkService.isOnline()) return;

    const syncKey = currentUser.role === 'ASM'
      ? `province_${currentUser.province_uuid}`
      : 'global';

    if (!this.isSyncExpired(syncKey)) {
      console.log(`⏩ [downloadAllCloudBrandsToLocal] Cache "${syncKey}" encore frais — sync ignorée`);
      return;
    }

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
                this.markSynced(syncKey);
                console.log(`✅ [downloadAllCloudBrandsToLocal] Sync terminée — ${response.pagination?.total_records ?? '?'} Brands en cache local`);
              }
            });
          } else if (page === 1) {
            // Aucune donnée mais pas d'erreur → marquer quand même pour éviter les boucles
            this.markSynced(syncKey);
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
   * Respecte un TTL de 24 h par territoire : si le cache est encore frais, aucun
   * téléchargement n'est lancé. Un re-téléchargement est forcé après un Create/Update/Delete.
   */
  downloadAllCloudBrandsByTerritoryToLocal(name: string, territoire_uuid: string): void {
    if (!this.networkService.isOnline()) return;

    const syncKey = `${name}_${territoire_uuid}`;

    if (!this.isSyncExpired(syncKey)) {
      console.log(`⏩ [downloadAllCloudBrandsByTerritoryToLocal] Cache "${syncKey}" encore frais — sync ignorée`);
      return;
    }

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
                this.markSynced(syncKey);
                console.log(`✅ [downloadAllCloudBrandsByTerritoryToLocal] Sync "${syncKey}" terminée — ${response.pagination?.total_records ?? '?'} Brands en cache local`);
              }
            });
          } else if (page === 1) {
            this.markSynced(syncKey);
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
   * Supprime les entrées en doublon dans la table brands (même uuid, plusieurs id locaux).
   * Appelée une seule fois par session via un flag localStorage.
   */
  private _duplicatesPurged = false;
  private purgeLocalDuplicates(): void {
    if (this._duplicatesPurged) return;
    this._duplicatesPurged = true;

    db.brands.toArray().then(all => {
      const seenUuid = new Map<string, number>(); // uuid → id à conserver
      const toDelete: number[] = [];

      for (const brand of all) {
        if (!brand.uuid || brand.id == null) continue;
        if (seenUuid.has(brand.uuid)) {
          toDelete.push(brand.id as number); // doublon : marquer pour suppression
        } else {
          seenUuid.set(brand.uuid, brand.id as number);
        }
      }

      if (toDelete.length > 0) {
        db.brands.bulkDelete(toDelete).then(() =>
          console.log(`🧹 [purgeLocalDuplicates] ${toDelete.length} doublons supprimés du cache local Brands`)
        );
      }
    }).catch(err => console.warn('⚠️ purgeLocalDuplicates:', err));
  }

  /**
   * Met à jour le cache local avec les données du serveur.
   *
   * Stratégie anti-doublons :
   * - On interroge Dexie pour récupérer les `id` locaux correspondant aux `uuid` entrants.
   * - Si un uuid existe déjà localement, on réutilise son `id` (→ mise à jour).
   * - Si le uuid est inconnu, on omet `id` (→ Dexie génère un nouvel auto-incrémenté).
   * - On n'utilise JAMAIS `brand.ID` du serveur comme clé primaire locale car il peut
   *   être absent ou entrer en collision avec un `id` Dexie existant.
   */
  private async updateLocalCache(brands: IBrand[]): Promise<void> {
    if (!brands?.length) return;
    try {
      const incomingUuids = brands.map(b => b.uuid).filter(Boolean) as string[];

      const brandsToStore = brands
        .filter(brand => !!brand.uuid)
        .map(brand => ({
          ID: brand.ID,
          uuid: brand.uuid!,
          name: brand.name,
          country_uuid: brand.country_uuid,
          province_uuid: brand.province_uuid,
          signature: brand.signature,
          CreatedAt: brand.CreatedAt,
          UpdatedAt: brand.UpdatedAt,
          sync_status: 'synced' as const,
          total_brand_usage: brand.total_brand_usage
        }));

      // Transaction atomique : supprime les enregistrements existants avec ces UUID
      // puis insère les nouveaux. Cela évite les doublons en cas d'appels concurrents.
      await db.transaction('rw', db.brands, async () => {
        await db.brands.where('uuid').anyOf(incomingUuids).delete();
        await db.brands.bulkAdd(brandsToStore as IBrand[]);
      });

      console.log(`💾 ${brandsToStore.length} Brands mis à jour dans le cache local`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache local:', error);
    }
  }

  /**
   * Récupère les Brands depuis le cache local avec format de réponse unifié
   */
  private async getFromLocalCache(search: string = ''): Promise<any> {
    let brands: IBrand[];

    if (search) {
      brands = await db.brands
        .filter(brand => brand.name?.toLowerCase().includes(search.toLowerCase()))
        .toArray();
    } else {
      brands = await db.brands.toArray();
    }

    // Dédoublonnage par UUID (filet de sécurité contre les doublons résiduels)
    const seen = new Set<string>();
    brands = brands.filter(b => {
      if (!b.uuid || seen.has(b.uuid)) return false;
      seen.add(b.uuid);
      return true;
    });

    return {
      data: brands,
      pagination: {
        total_records: brands.length,
        total_pages: 1,
        current_page: 1,
        page_size: brands.length
      },
      offline: true
    };
  }

  /**
   * Récupère les Brands par province depuis le cache local avec format de réponse unifié
   */
  private async getFromLocalCacheByProvince(province_uuid: string, search: string = ''): Promise<any> {
    let brands = await db.brands.where('province_uuid').equals(province_uuid).toArray();

    if (search) {
      brands = brands.filter(brand =>
        brand.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Dédoublonnage par UUID (filet de sécurité contre les doublons résiduels)
    const seen = new Set<string>();
    brands = brands.filter(b => {
      if (!b.uuid || seen.has(b.uuid)) return false;
      seen.add(b.uuid);
      return true;
    });

    return {
      data: brands,
      pagination: {
        total_records: brands.length,
        total_pages: 1,
        current_page: 1,
        page_size: brands.length
      },
      offline: true
    };
  }
}
