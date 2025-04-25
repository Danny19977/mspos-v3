import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class AreaService extends ApiService {
  endpoint: string = `${environment.apiUrl}/areas`; 

  getAllSupAreaById(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all-area/${uuid}`);
  }

  getAreaDropdown(): Observable<any> {
    return this.http.get(`${this.endpoint}/all/dropdown`);
  }
}
