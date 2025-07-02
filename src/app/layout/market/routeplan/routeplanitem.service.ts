import { Injectable } from '@angular/core'; 
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RouteplanItemService extends ApiService {
  endpoint: string = `${environment.apiUrl}/routeplan-items`;
 
}
