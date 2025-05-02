import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/google-map`;

  getGoogleMap(start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set("start_date", start_date)
      .set("end_date", end_date)
    return this.http.get<any>(`${this.endpoint}/view`, { params });
  }
}
