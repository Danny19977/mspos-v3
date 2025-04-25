import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class PosVenteService extends ApiService {
  endpoint: string = `${environment.apiUrl}/pos`; 

  getAllAreaById(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all-area/${uuid}`);
  }
}
