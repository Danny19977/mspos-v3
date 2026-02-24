import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { IObservationApiResponse } from '../models/observation.model';

export interface ObservationFilters {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

@Injectable()
export class ObservationService extends ApiService {
  endpoint: string = `${environment.apiUrl}/observations`;

  /**
   * Endpoint intelligent : le backend filtre automatiquement selon le rôle JWT (cookie).
   * GET /api/observations/all/paginate?token=<jwt>
   */
  getByRole(filters: ObservationFilters = {}): Observable<IObservationApiResponse> {
    const token = localStorage.getItem('auth_uuid') ?? '';
    let params = this.buildParams(filters).set('token', token);
    return this.http.get<IObservationApiResponse>(`${this.endpoint}/all/paginate`, { params });
  }

  /** GET /api/observations/all/paginate/country/:country_uuid */
  getByCountry(country_uuid: string, filters: ObservationFilters = {}): Observable<IObservationApiResponse> {
    return this.http.get<IObservationApiResponse>(
      `${this.endpoint}/all/paginate/country/${country_uuid}`,
      { params: this.buildParams(filters) }
    );
  }

  /** GET /api/observations/all/paginate/province/:province_uuid */
  getByProvince(province_uuid: string, filters: ObservationFilters = {}): Observable<IObservationApiResponse> {
    return this.http.get<IObservationApiResponse>(
      `${this.endpoint}/all/paginate/province/${province_uuid}`,
      { params: this.buildParams(filters) }
    );
  }

  /** GET /api/observations/all/paginate/area/:area_uuid */
  getByArea(area_uuid: string, filters: ObservationFilters = {}): Observable<IObservationApiResponse> {
    return this.http.get<IObservationApiResponse>(
      `${this.endpoint}/all/paginate/area/${area_uuid}`,
      { params: this.buildParams(filters) }
    );
  }

  /** GET /api/observations/all/paginate/subarea/:sub_area_uuid */
  getBySubArea(sub_area_uuid: string, filters: ObservationFilters = {}): Observable<IObservationApiResponse> {
    return this.http.get<IObservationApiResponse>(
      `${this.endpoint}/all/paginate/subarea/${sub_area_uuid}`,
      { params: this.buildParams(filters) }
    );
  }

  /** GET /api/observations/all/paginate/commune/:commune_uuid */
  getByCommune(commune_uuid: string, filters: ObservationFilters = {}): Observable<IObservationApiResponse> {
    return this.http.get<IObservationApiResponse>(
      `${this.endpoint}/all/paginate/commune/${commune_uuid}`,
      { params: this.buildParams(filters) }
    );
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  private buildParams(filters: ObservationFilters): HttpParams {
    let params = new HttpParams();
    if (filters.page)       params = params.set('page',       filters.page.toString());
    if (filters.limit)      params = params.set('limit',      filters.limit.toString());
    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date)   params = params.set('end_date',   filters.end_date);
    if (filters.search)     params = params.set('search',     filters.search);
    return params;
  }
}
