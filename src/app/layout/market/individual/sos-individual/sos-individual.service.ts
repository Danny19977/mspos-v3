import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface SosSummary {
  user_uuid: string;
  fullname: string;
  total_pos_visited: number;
  total_fardes_pos: number;
  brand_count: number;
  universe_pos: number;
  reach_rate: number;
  dominant_brand: string;
  dominant_brand_sos: number;
}

export interface SosByBrand {
  brand_uuid: string;
  brand_name: string;
  brand_fardes: number;
  total_fardes: number;
  sos_percent: number;
  pos_count: number;
  avg_fardes_per_pos: number;
}

export interface SosPosItem {
  pos_uuid: string;
  pos_name: string;
  shop: string;
  commune: string;
  brand_uuid: string;
  brand_name: string;
  number_farde: number;
  pos_total_fardes: number;
  sos_per_pos: number;
  visit_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class SosIndividualService {
  private readonly base = `${environment.apiUrl}/sos-individual`;

  constructor(private http: HttpClient) {}

  getSummary(userUuid: string, startDate: string, endDate: string): Observable<{ status: string; data: SosSummary }> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get<{ status: string; data: SosSummary }>(
      `${this.base}/summary/${userUuid}`,
      { params }
    );
  }

  getByBrand(userUuid: string, startDate: string, endDate: string): Observable<{ status: string; data: SosByBrand[] }> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get<{ status: string; data: SosByBrand[] }>(
      `${this.base}/by-brand/${userUuid}`,
      { params }
    );
  }

  getPosList(userUuid: string, startDate: string, endDate: string): Observable<{ status: string; data: SosPosItem[] }> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    return this.http.get<{ status: string; data: SosPosItem[] }>(
      `${this.base}/pos-list/${userUuid}`,
      { params }
    );
  }
}
