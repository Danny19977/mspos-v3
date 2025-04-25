import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class SummaryService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/sammury`;
 

  DrCount(): Observable<any> {
    return this.http.get(`${this.endpoint}/dr-count`);
  } 

  POSCount(): Observable<any> {
    return this.http.get(`${this.endpoint}/pos-count`);
  }

  ProvinceCount(): Observable<any> {
    return this.http.get(`${this.endpoint}/province-count`);
  }

  AreaCount(): Observable<any> {
    return this.http.get(`${this.endpoint}/area-count`);
  }


  SOSPie(start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/sos-pie/${start_date}/${end_date}`);
  }

  TrackingVisitDR(days: string, start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/tracking-visit-dr/${days}/${start_date}/${end_date}`);
  }

  SummaryChartBar(start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/summary-chart-bar/${start_date}/${end_date}`);
  }

  BetterDR(start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/better-dr/${start_date}/${end_date}`);
  }

  BetterSup(start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/better-supervisor/${start_date}/${end_date}`);
  }

  StatusEquipement(start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/status-equements/${start_date}/${end_date}`);
  }

  GoogleMap(start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/google-maps/${start_date}/${end_date}`);
  }

  PriceSale(start_date: string, end_date: string): Observable<any> {
    return this.http.get(`${this.endpoint}/price-sales/${start_date}/${end_date}`);
  }
 
} 