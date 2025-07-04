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

}
