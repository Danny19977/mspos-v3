import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../shared/services/api.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KpiService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/kpi`;

  TableViewCountry(country_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/total-visits-by-country`, { params });
  }

  TableViewProvince(country_uuid: string, province_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/total-visits-by-province`, { params });
  }

  TableViewArea(country_uuid: string, province_uuid: string,
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/total-visits-by-area`, { params });
  }

  TableViewSubArea(country_uuid: string, province_uuid: string, area_uuid: string,
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/total-visits-by-subarea`, { params });
  }

  TableViewCommune(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string,
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
      .set("sub_area_uuid", sub_area_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/total-visits-by-commune`, { params });
  }

  UserVisitSummary(
    country_uuid: string,
    start_date: string,
    end_date: string,
    filters: {
      province_uuid?: string;
      area_uuid?: string;
      sub_area_uuid?: string;
      commune_uuid?: string;
      title?: string;
      user_uuid?: string;
    } = {}
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    if (filters.province_uuid)  { params = params.set('province_uuid',  filters.province_uuid); }
    if (filters.area_uuid)      { params = params.set('area_uuid',      filters.area_uuid); }
    if (filters.sub_area_uuid)  { params = params.set('sub_area_uuid',  filters.sub_area_uuid); }
    if (filters.commune_uuid)   { params = params.set('commune_uuid',   filters.commune_uuid); }
    if (filters.title)          { params = params.set('title',          filters.title); }
    if (filters.user_uuid)      { params = params.set('user_uuid',      filters.user_uuid); }
    return this.http.get<any>(`${this.endpoint}/user-visit-summary`, { params });
  }

}
