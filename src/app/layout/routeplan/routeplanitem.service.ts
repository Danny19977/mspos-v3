import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../shared/services/api.service';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteplanItemService extends ApiService {
  endpoint: string = `${environment.apiUrl}/routeplan-items`;

    updatePosStatus(pos_uuid: string, data: any): Observable<any> {
      return this.http.put(`${this.endpoint}/update/status/${pos_uuid}`, data).pipe(tap(() => { 
        console.log(`Updated status for POS with UUID: ${pos_uuid}`);
        this.refreshData$.next();
      }));
    }
}
