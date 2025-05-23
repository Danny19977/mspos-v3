import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class SupService extends ApiService {
  endpoint: string = `${environment.apiUrl}/sups`; 

  GetSupASMByID(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all-asm/${uuid}`);
  }
}
