import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class NdService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/numeric-distribution`;


  tableView(province: string, start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/table-view/${province}/${start_date}/${end_date}`);
  }

  NdByYear(province: string): Observable<any> {
    return this.http.get(`${this.endpoint}/nd-year/${province}`);
  } 
 
}
