import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse2 } from '../../../shared/model/api-response.model';
import { IUser } from '../../management/user/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PosformService extends ApiService {
  endpoint: string = `${environment.apiUrl}/posforms`;

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
      .set('page_size', pageSize.toString()) // Utiliser page_size pour être cohérent avec l'API
      .set('start_date', startDate)
      .set('end_date', endDate);

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

    // Filtres commerciaux
    if (filters.price) {
      params = params.set('price', filters.price);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.brandCount) {
      params = params.set('brandCount', filters.brandCount);
    }
    if (filters.posType) {
      params = params.set('posType', filters.posType);
    }
    if (filters.posSearch) {
      params = params.set('posSearch', filters.posSearch);
    }

    // Filtres hiérarchie commerciale avec recherche intégrée
    if (filters.asm) {
      params = params.set('asm', filters.asm);
    }
    if (filters.asmSearch) {
      params = params.set('asmSearch', filters.asmSearch);
    }
    if (filters.supervisor) {
      params = params.set('supervisor', filters.supervisor);
    }
    if (filters.supervisorSearch) {
      params = params.set('supervisorSearch', filters.supervisorSearch);
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

    // Filtres temporels
    if (filters.quickDate) {
      params = params.set('quickDate', filters.quickDate);
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
    startDate: string,
    endDate: string,
    filters: any = {}
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString()) // Utiliser page_size pour être cohérent avec l'API
      .set('start_date', startDate)
      .set('end_date', endDate);

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

    // Filtres commerciaux
    if (filters.price) {
      params = params.set('price', filters.price);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.brandCount) {
      params = params.set('brandCount', filters.brandCount);
    }
    if (filters.posType) {
      params = params.set('posType', filters.posType);
    }
    if (filters.posSearch) {
      params = params.set('posSearch', filters.posSearch);
    }

    // Filtres hiérarchie commerciale avec recherche intégrée
    if (filters.asm) {
      params = params.set('asm', filters.asm);
    }
    if (filters.asmSearch) {
      params = params.set('asmSearch', filters.asmSearch);
    }
    if (filters.supervisor) {
      params = params.set('supervisor', filters.supervisor);
    }
    if (filters.supervisorSearch) {
      params = params.set('supervisorSearch', filters.supervisorSearch);
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

    // Filtres temporels
    if (filters.quickDate) {
      params = params.set('quickDate', filters.quickDate);
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
      return this.http.get<any>(`${this.endpoint}/all/paginate/commune/${territoire_uuid}`, { params });
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
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate`, { params });
  }

  getPaginatedRangeDateByCountryUUID(country_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/country/${country_uuid}`, { params });
  }

   override getPaginatedRangeDateByProvinceId(province_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/province/${province_uuid}`, { params });
  }

  override getPaginatedRangeDateByAreaId(area_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/area/${area_uuid}`, { params });
  }

  override getPaginatedRangeDateBySubAreaId(sub_area_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/subarea/${sub_area_uuid}`, { params });
  }

  override getPaginatedRangeDateByCommuneId(user_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/commune/${user_uuid}`, { params });
  }
}
