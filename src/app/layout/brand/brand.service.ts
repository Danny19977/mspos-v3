import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class BrandService extends ApiService {
  endpoint: string = `${environment.apiUrl}/brands`; 
}
