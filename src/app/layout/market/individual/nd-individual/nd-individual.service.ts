import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface NdSummary {
  user_uuid: string;
  fullname: string;
  total_pos_visited: number;
  nd_pos: number;
  nd_percent: number;
  universe_pos: number;
  reach_rate: number;
}

export interface NdByBrand {
  brand_uuid: string;
  brand_name: string;
  nd_pos: number;
  total_pos: number;
  nd_percent: number;
}

export interface NdPosItem {
  pos_uuid: string;
  pos_name: string;
  shop: string;
  commune: string;
  brand_uuid: string;
  brand_name: string;
  counter: number;
  nd_active: boolean;
  visit_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class NdIndividualService {
  private readonly base = `${environment.apiUrl}/nd-individual`;

  constructor(private http: HttpClient) {}

  getSummary(userUuid: string, startDate: string, endDate: string): Observable<{ status: string; data: NdSummary }> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get<{ status: string; data: NdSummary }>(
      `${this.base}/summary/${userUuid}`,
      { params }
    );
  }

  getByBrand(userUuid: string, startDate: string, endDate: string): Observable<{ status: string; data: NdByBrand[] }> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get<{ status: string; data: NdByBrand[] }>(
      `${this.base}/by-brand/${userUuid}`,
      { params }
    );
  }

  getPosList(userUuid: string, startDate: string, endDate: string): Observable<{ status: string; data: NdPosItem[] }> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get<{ status: string; data: NdPosItem[] }>(
      `${this.base}/pos-list/${userUuid}`,
      { params }
    );
  }
}
