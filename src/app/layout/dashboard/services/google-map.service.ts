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

  getGoogleMap(
    start_date:    string,
    end_date:      string,
    search?:       string,
    province_uuid?: string,
    user_type?:    string,
  ): Observable<any> {
    let params = new HttpParams()
      .set('start_date', start_date)
      .set('end_date',   end_date);

    if (search        && search.trim()        !== '') params = params.set('search',        search.trim());
    if (province_uuid && province_uuid.trim() !== '') params = params.set('province_uuid', province_uuid.trim());
    if (user_type     && user_type.trim()     !== '') params = params.set('user_type',     user_type.trim());

    return this.http.get<any>(`${this.endpoint}/view`, { params });
  }
}
