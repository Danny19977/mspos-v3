import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ProvinceService extends ApiService {
  endpoint: string = `${environment.apiUrl}/provinces`; 

  getProvinceDropdown(): Observable<any> {
    return this.http.get(`${this.endpoint}/all/dropdown`);
  }

  
}
 