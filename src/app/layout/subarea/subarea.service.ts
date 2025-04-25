import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SubareaService extends ApiService {
  endpoint: string = `${environment.apiUrl}/subareas`; 
}
