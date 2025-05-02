import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleEvolutionService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/share-of-stock`;

  SosTableViewProvince(country_uuid: string, province_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("country_uuid", country_uuid)
      .set("province_uuid", province_uuid)
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/table-view-province`, { params });
  }

  


}
