import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleEvolutionService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/sales-evolution`;

  TableViewProvince(country_uuid: string, province_uuid: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
    return this.http.get<any>(`${this.endpoint}/table-view-province`, { params });
  }

  TableViewArea(country_uuid: string, province_uuid: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
    return this.http.get<any>(`${this.endpoint}/table-view-area`, { params });
  }

  TableViewSubArea(country_uuid: string, province_uuid: string, area_uuid: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
    return this.http.get<any>(`${this.endpoint}/table-view-subarea`, { params });
  }

  TableViewCommune(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
      .set("sub_area_uuid", sub_area_uuid)
    return this.http.get<any>(`${this.endpoint}/table-view-commune`, { params });
  }


  
  TableViewProvincePrice(country_uuid: string, province_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-province-price`, { params });
  }

  TableViewAreaPrice(country_uuid: string, province_uuid: string,
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-area-price`, { params });
  }

  TableViewSubAreaPrice(country_uuid: string, province_uuid: string, area_uuid: string, 
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-subarea-price`, { params });
  }

  TableViewCommunePrice(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string,
    start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("area_uuid", area_uuid)
      .set("sub_area_uuid", sub_area_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-commune-price`, { params });
  }

}
