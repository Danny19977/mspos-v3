import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class SosService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/share-of-stock`;


  SOSPieChart(province: string, start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/sos-pie/${province}/${start_date}/${end_date}`);
  }

  SOSTableView(province: string, start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/table-view/${province}/${start_date}/${end_date}`);
  }

  SOSByYear(province: string): Observable<any> {
    return this.http.get(`${this.endpoint}/sos-year/${province}`);
  }
 
}
 
