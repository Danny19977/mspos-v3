import { Injectable } from '@angular/core'; 
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubareaService extends ApiService {
  endpoint: string = `${environment.apiUrl}/subareas`; 
}
