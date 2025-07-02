import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { IUser } from '../../management/user/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PosVenteService extends ApiService {
  endpoint: string = `${environment.apiUrl}/pos`;

  getAllAreaById(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all-area/${uuid}`);
  }

  /**
   * Récupère les POS avec filtres avancés
   * Utilise l'endpoint optimisé du backend Go Fiber avec tous les filtres disponibles
   */
  getPaginatedWithAdvancedFilters(
    currentUser: IUser,
    page: number,
    pageSize: number,
    filters: any = {}
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    // Ajouter les filtres de recherche générale
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    // Filtres géographiques
    if (filters.country) {
      params = params.set('country', filters.country);
    }
    if (filters.province) {
      params = params.set('province', filters.province);
    }
    if (filters.area) {
      params = params.set('area', filters.area);
    }
    if (filters.subarea) {
      params = params.set('subarea', filters.subarea);
    }
    if (filters.commune) {
      params = params.set('commune', filters.commune);
    }

    // Filtres spécifiques aux POS
    if (filters.postype) {
      params = params.set('postype', filters.postype);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.shop) {
      params = params.set('shop', filters.shop);
    }
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.gerant) {
      params = params.set('gerant', filters.gerant);
    }
    if (filters.telephone) {
      params = params.set('telephone', filters.telephone);
    }
    if (filters.quartier) {
      params = params.set('quartier', filters.quartier);
    }
    if (filters.avenue) {
      params = params.set('avenue', filters.avenue);
    }
    if (filters.reference) {
      params = params.set('reference', filters.reference);
    }
    if (filters.fullname) {
      params = params.set('signature', filters.fullname);
    }

    // Filtres hiérarchie commerciale
    if (filters.asm) {
      params = params.set('asm', filters.asm);
    }
    if (filters.asmSearch) {
      params = params.set('asmSearch', filters.asmSearch);
    }
    if (filters.supervisor || filters.sup) {
      params = params.set('supervisor', filters.supervisor || filters.sup);
    }
    if (filters.supervisorSearch || filters.supSearch) {
      params = params.set('supervisorSearch', filters.supervisorSearch || filters.supSearch);
    }
    if (filters.dr) {
      params = params.set('dr', filters.dr);
    }
    if (filters.drSearch) {
      params = params.set('drSearch', filters.drSearch);
    }
    if (filters.cyclo) {
      params = params.set('cyclo', filters.cyclo);
    }
    if (filters.cycloSearch) {
      params = params.set('cycloSearch', filters.cycloSearch);
    }

    // Filtres spécifiques aux POS (synchronisation, etc.)
    if (filters.sync !== undefined) {
      params = params.set('sync', filters.sync.toString());
    }
    if (filters.posformsCount) {
      params = params.set('posformsCount', filters.posformsCount);
    }

    if (currentUser.role == 'ASM') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/province/${currentUser.province_uuid}`, { params });

    } else if (currentUser.role == 'Supervisor') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/area/${currentUser.area_uuid}`, { params });

    } else if (currentUser.role == 'DR') {
      return this.http.get<any>(`${this.endpoint}/all/paginate/subarea/${currentUser.sub_area_uuid}`, { params });

    } else if (currentUser.role == 'Cyclo') {
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
    filters: any = {}
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    // Ajouter les filtres de recherche générale
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    // Filtres géographiques
    if (filters.country) {
      params = params.set('country', filters.country);
    }
    if (filters.province) {
      params = params.set('province', filters.province);
    }
    if (filters.area) {
      params = params.set('area', filters.area);
    }
    if (filters.subarea) {
      params = params.set('subarea', filters.subarea);
    }
    if (filters.commune) {
      params = params.set('commune', filters.commune);
    }

    // Filtres spécifiques aux POS
    if (filters.postype) {
      params = params.set('postype', filters.postype);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.shop) {
      params = params.set('shop', filters.shop);
    }
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.gerant) {
      params = params.set('gerant', filters.gerant);
    }
    if (filters.telephone) {
      params = params.set('telephone', filters.telephone);
    }
    if (filters.quartier) {
      params = params.set('quartier', filters.quartier);
    }
    if (filters.avenue) {
      params = params.set('avenue', filters.avenue);
    }
    if (filters.reference) {
      params = params.set('reference', filters.reference);
    }
    if (filters.fullname) {
      params = params.set('signature', filters.fullname);
    }

    // Filtres hiérarchie commerciale
    if (filters.asm) {
      params = params.set('asm', filters.asm);
    }
    if (filters.asmSearch) {
      params = params.set('asmSearch', filters.asmSearch);
    }
    if (filters.supervisor || filters.sup) {
      params = params.set('supervisor', filters.supervisor || filters.sup);
    }
    if (filters.supervisorSearch || filters.supSearch) {
      params = params.set('supervisorSearch', filters.supervisorSearch || filters.supSearch);
    }
    if (filters.dr) {
      params = params.set('dr', filters.dr);
    }
    if (filters.drSearch) {
      params = params.set('drSearch', filters.drSearch);
    }
    if (filters.cyclo) {
      params = params.set('cyclo', filters.cyclo);
    }
    if (filters.cycloSearch) {
      params = params.set('cycloSearch', filters.cycloSearch);
    }

    // Filtres spécifiques aux POS (synchronisation, etc.)
    if (filters.sync !== undefined) {
      params = params.set('sync', filters.sync.toString());
    }
    if (filters.posformsCount) {
      params = params.set('posformsCount', filters.posformsCount);
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


  getGoogleMap(pos_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/map-pos/${pos_uuid}`, { params });
  }
}
