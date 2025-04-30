import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { HttpParams } from '@angular/common/http';
import { ApiResponseNdDashboard, ApiResponseNdDashboardTotalByMonth } from '../../../shared/model/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class NdService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/numeric-distribution`;

  NdTableViewProvince(country_uuid: string, province_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid) 
      .set("province_uuid", province_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-province`, { params });
  }

  NdTableViewArea(country_uuid: string, province_uuid: string,
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-area`, { params });
  }

  NdTableViewSubArea(country_uuid: string, province_uuid: string, area_uuid: string, 
    start_date: string, end_date: string): Observable<ApiResponseNdDashboard> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<ApiResponseNdDashboard>(`${this.endpoint}/table-view-subarea`, { params });
  }

  NdTableViewCommune(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string,
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
      .set("sub_area_uuid", sub_area_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-commune`, { params });
  }


 NdTotalByBrandByMonth(country_uuid: string, year: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("year", year) 
    return this.http.get<any>(`${this.endpoint}/line-chart-by-month`, { params });
  }

}
