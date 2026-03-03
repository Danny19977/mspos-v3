import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IUser } from '../../management/user/models/user.model';
import { IPosForm } from './models/posform.model';
import { IPosFormItem } from './models/posform_item.model';
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
        // ✅ Ne synchroniser que si le posform a déjà un POS assigné
        if (posformData.pos_uuid && posformData.pos_uuid.trim() !== '') {
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
        } else {
          console.log("⏸️ Posform créé localement sans POS — synchronisation différée jusqu'à l'assignation d'un POS");
        }
        
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
   *
   * ⚠️ Cas critique : si le posform n'a jamais été envoyé au serveur (sync_status = 'pending'),
   * un PUT /update/:uuid échouerait silencieusement côté Go (record introuvable → Save sur struct
   * vide → UUID perdu). On envoie donc un CREATE dans ce cas, après avoir annulé toute opération
   * en attente pour éviter les doublons.
   */
  override update(uuid: string, data: Partial<IPosForm>): Observable<any> {
    // Lire le sync_status AVANT la modification locale pour décider create vs update
    return from(db.posForms.where('uuid').equals(uuid).first()).pipe(
      switchMap(async (existing) => {
        const neverSynced = !existing || existing.sync_status === 'pending' || existing.sync_status === 'error';

        const posformData: Partial<IPosForm> = {
          ...data,
          uuid,
          sync_status: 'pending',
          UpdatedAt: new Date()
        };

        await this.updatePosformLocally(uuid, posformData);

        if (posformData.pos_uuid && posformData.pos_uuid.trim() !== '') {
          if (neverSynced) {
            // Annuler toute opération en attente liée à cet uuid (ex : un CREATE différé)
            // pour éviter les doublons lors de la synchronisation.
            await this.syncQueue.cancelPendingOperationsForEntity('posform', uuid);

            // Le posform n'existe pas encore côté serveur : envoyer un CREATE
            await this.syncQueue.enqueue({
              operationId: uuidv4(),
              entityType: 'posform',
              operation: 'create',
              endpoint: `${this.endpoint}/create`,
              data: { ...data, uuid },
              tempId: uuid,
              timestamp: new Date(),
              retryCount: 0,
              status: 'pending',
              userId: data.user_uuid
            });
            console.log(`✅ Posform jamais syncé → CREATE enqueué (uuid: ${uuid})`);
          } else {
            // Le posform existe déjà sur le serveur : envoyer un UPDATE normal
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
            console.log('✅ Posform modifié localement et mis en file de synchronisation (UPDATE)');
          }
        } else {
          console.log("⏸️ Posform modifié localement sans POS — synchronisation différée jusqu'à l'assignation d'un POS");
        }

        return {
          data: { ...posformData },
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
    return from(this.deletePosformSmart(uuid));
  }

  /**
   * Supprime un Posform intelligemment :
   * - Si encore local (pending, jamais envoyé au serveur) : suppression directe d'IndexedDB, pas de sync.
   * - Si déjà synchronisé : soft-delete local + enqueue vers le serveur.
   */
  private async deletePosformSmart(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID manquant pour la suppression du posform');
    }

    const posform = await db.posForms.where('uuid').equals(uuid).first();

    if (posform?.sync_status === 'pending') {
      // Jamais envoyé au serveur : annuler les opérations en file d'attente
      // (crée/update) avant de supprimer localement pour éviter les données fantômes
      await this.syncQueue.cancelPendingOperationsForEntity('posform', uuid);
      await db.posForms.where('uuid').equals(uuid).delete();

      // Supprimer aussi les posformItems orphelins et annuler leurs opérations en queue
      const orphanItems = await (db.posformItems as any).where('posform_uuid').equals(uuid).toArray();
      for (const item of orphanItems) {
        if (item.uuid) {
          await this.syncQueue.cancelPendingOperationsForEntity('posformItem', item.uuid);
        }
      }
      await (db.posformItems as any).where('posform_uuid').equals(uuid).delete();
      console.log(`🗑️ Posform local ${uuid} + ${orphanItems.length} item(s) supprimés directement (jamais synchronisés)`);
      return {
        offline: true,
        local: true,
        message: 'Rapport local supprimé.'
      };
    }

    if (posform?.sync_status === 'deleted') {
      // Déjà marqué comme supprimé, ne pas ré-enqueue
      console.warn(`⚠️ Posform ${uuid} déjà marqué comme supprimé, ignoré`);
      return { message: 'Déjà supprimé.' };
    }

    // Déjà synchronisé : marquer comme supprimé localement + enqueue vers le serveur
    await this.markPosformAsDeleted(uuid);
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
      sync_status: 'deleted'
    });

    console.log(`💾 Posform ${uuid} marqué comme supprimé (sync_status: deleted)`);
  }

  /**
   * Met à jour le cache local avec les données du serveur.
   *
   * Stratégie anti-doublons : même logique que BrandService —
   * on interroge Dexie par uuid avant le bulkPut pour réutiliser l'id local existant.
   * Seuls les posforms avec uuid défini sont traités.
   */
  async updateLocalCache(posforms: IPosForm[]): Promise<void> {
    if (!posforms?.length) return;
    try {
      // 1. Récupérer les ids locaux correspondant aux uuid entrants
      const incomingUuids = posforms.map(pf => pf.uuid).filter(Boolean) as string[];
      const existingRecords = await db.posForms.where('uuid').anyOf(incomingUuids).toArray();
      const uuidToLocalId = new Map<string, number>();
      for (const rec of existingRecords) {
        if (rec.uuid && rec.id != null) uuidToLocalId.set(rec.uuid, rec.id as number);
      }

      // Récupérer les uuids des posforms marqués comme supprimés localement
      // pour ne pas les écraser lors du rafraîchissement depuis le serveur (anti-résurrection)
      const deletedUuids = new Set(
        (await db.posForms.toCollection().toArray())
          .filter(pf => pf.sync_status === 'deleted' && !!pf.uuid)
          .map(pf => pf.uuid as string)
      );

      const posformsToStore = posforms
        .filter(pf => !!pf.uuid && !deletedUuids.has(pf.uuid!))
        .map(pf => ({
          ...(uuidToLocalId.has(pf.uuid!) ? { id: uuidToLocalId.get(pf.uuid!) } : {}),
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

      // Sauvegarder aussi les PosFormItems reçus du serveur dans db.posformItems.
      // Anti-doublons : même logique que pour les posforms — on récupère l'id local
      // existant par uuid avant le bulkPut pour éviter d'insérer des doublons
      // à chaque synchronisation.
      const allIncomingItems: any[] = [];
      for (const pf of posforms) {
        if (!pf.uuid || !pf.PosFormItems?.length) continue;
        for (const item of pf.PosFormItems) {
          if (!item.uuid) continue;
          allIncomingItems.push({ item, posform_uuid: pf.uuid });
        }
      }

      if (allIncomingItems.length > 0) {
        const incomingItemUuids = allIncomingItems.map(e => e.item.uuid as string);
        const existingItems = await (db.posformItems as any).where('uuid').anyOf(incomingItemUuids).toArray();
        const itemUuidToLocalId = new Map<string, number>();
        for (const rec of existingItems) {
          if (rec.uuid && rec.id != null) itemUuidToLocalId.set(rec.uuid, rec.id as number);
        }

        const itemsToStore = allIncomingItems.map(({ item, posform_uuid }) => ({
          ...(itemUuidToLocalId.has(item.uuid) ? { id: itemUuidToLocalId.get(item.uuid) } : {}),
          uuid: item.uuid,
          posform_uuid,
          brand_uuid: item.brand_uuid,
          brand_name: item.brand_name,
          number_farde: item.number_farde ?? 0,
          counter: item.counter ?? 0,
          sold: item.sold ?? 0,
          sync_status: 'synced'
        }));

        await (db.posformItems as any).bulkPut(itemsToStore);
        console.log(`💾 ${itemsToStore.length} PosFormItems mis à jour (${itemUuidToLocalId.size} existants, ${itemsToStore.length - itemUuidToLocalId.size} nouveaux)`);
      }

      console.log(`💾 ${posformsToStore.length} Posforms mis à jour dans le cache local (${uuidToLocalId.size} existants, ${posformsToStore.length - uuidToLocalId.size} nouveaux)`);
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

    // Exclure les posforms marqués comme supprimés localement
    posforms = posforms.filter(pf => pf.sync_status !== 'deleted');

    // Filtrer par plage de dates
    // Utiliser le temps local (T00:00:00 / T23:59:59.999 sans 'Z') pour éviter
    // le problème de parsing UTC des chaînes ISO date-only (ex: '2026-03-03').
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');
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

    // Trier : enregistrements locaux non-synchronisés (pending/error) en premier,
    // puis par date décroissante
    posforms.sort((a, b) => {
      const aIsLocal = a.sync_status === 'pending' || a.sync_status === 'error' ? 0 : 1;
      const bIsLocal = b.sync_status === 'pending' || b.sync_status === 'error' ? 0 : 1;
      if (aIsLocal !== bIsLocal) return aIsLocal - bIsLocal;
      const da = a.CreatedAt ? new Date(a.CreatedAt).getTime() : 0;
      const db2 = b.CreatedAt ? new Date(b.CreatedAt).getTime() : 0;
      return db2 - da;
    });

    const total_records = posforms.length;
    const total_pages = Math.max(1, Math.ceil(total_records / pageSize));
    const offset = (page - 1) * pageSize;
    const paginated = posforms.slice(offset, offset + pageSize);

    // Hydrater la relation Pos depuis le cache local (db.pos)
    const posUuids = [...new Set(paginated.map(pf => pf.pos_uuid).filter(Boolean))] as string[];
    const posMap = new Map<string, any>();
    if (posUuids.length > 0) {
      const posRecords = await db.pos.where('uuid').anyOf(posUuids).toArray();
      posRecords.forEach(pos => { if (pos.uuid) posMap.set(pos.uuid, pos); });
      // Fallback : si le POS n'est pas dans db.pos, chercher le nom dans db.routePlanItems
      const missingUuids = posUuids.filter(uuid => !posMap.has(uuid));
      if (missingUuids.length > 0) {
        const rpiRecords = await (db.routePlanItems as any).where('pos_uuid').anyOf(missingUuids).toArray();
        rpiRecords.forEach((rpi: any) => {
          if (rpi.pos_uuid && !posMap.has(rpi.pos_uuid)) {
            posMap.set(rpi.pos_uuid, { uuid: rpi.pos_uuid, name: rpi.pos_name });
          }
        });
      }
    }

    // Hydrater la relation PosFormItems depuis le cache local (db.posformItems)
    const posformUuids = paginated.map(pf => pf.uuid).filter(Boolean) as string[];
    const posformItemsMap = new Map<string, IPosFormItem[]>();
    if (posformUuids.length > 0) {
      const allItems = await (db.posformItems as any).where('posform_uuid').anyOf(posformUuids).toArray();
      allItems.forEach((item: IPosFormItem) => {
        if (item.posform_uuid) {
          const existing = posformItemsMap.get(item.posform_uuid) || [];
          existing.push(item);
          posformItemsMap.set(item.posform_uuid, existing);
        }
      });
    }

    const hydratedPaginated = paginated.map(pf => ({
      ...pf,
      Pos: pf.pos_uuid ? (posMap.get(pf.pos_uuid) ?? pf.Pos) : pf.Pos,
      // ⚠️ On utilise UNIQUEMENT la map fraîche depuis db.posformItems.
      // Pas de fallback sur pf.PosFormItems (données potentiellement obsolètes ou mal associées).
      PosFormItems: pf.uuid ? (posformItemsMap.get(pf.uuid) ?? []) : []
    }));

    console.log(`📦 Posforms locaux: ${total_records} total, page ${page}/${total_pages}`);
    return {
      data: hydratedPaginated,
      pagination: {
        total_pages,
        total_records,
        current_page: page,
        page_size: pageSize
      },
      offline: true
    };
  }

  /**
   * Retourne les Posforms du cache local paginés, filtrés par POS UUID — OFFLINE FIRST
   */
  getPaginatedOfflineFirstByPosUUID(
    posUuid: string,
    page: number,
    pageSize: number,
    startDate: string,
    endDate: string
  ): Observable<any> {
    return from(this.getFromLocalCacheByPosUUID(posUuid, page, pageSize, startDate, endDate));
  }

  private async getFromLocalCacheByPosUUID(
    posUuid: string,
    page: number,
    pageSize: number,
    startDate: string,
    endDate: string
  ): Promise<any> {
    let posforms = await db.posForms.where('pos_uuid').equals(posUuid).toArray();

    const start = new Date(startDate);
    const end = new Date(endDate);
    posforms = posforms.filter(pf => {
      if (!pf.CreatedAt) return true;
      const d = new Date(pf.CreatedAt);
      return d >= start && d <= end;
    });

    posforms.sort((a, b) => {
      const da = a.CreatedAt ? new Date(a.CreatedAt).getTime() : 0;
      const db2 = b.CreatedAt ? new Date(b.CreatedAt).getTime() : 0;
      return db2 - da;
    });

    const total_records = posforms.length;
    const total_pages = Math.max(1, Math.ceil(total_records / pageSize));
    const offset = (page - 1) * pageSize;
    const paginated = posforms.slice(offset, offset + pageSize);

    console.log(`📦 Posforms locaux (POS ${posUuid}): ${total_records} total, page ${page}/${total_pages}`);
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
