import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';

// ── Shared geo param type ─────────────────────────────────────────────────────
export type WsGeoParams = {
  country_uuid:  string;
  province_uuid?: string;
  area_uuid?:     string;
  sub_area_uuid?: string;
  commune_uuid?:  string;
  start_date:    string;
  end_date:      string;
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  WsService — Weighted Sales (WS) Dashboard API client                  ║
// ║  Endpoint: /dashboard/weighted-sales                                    ║
// ║  WS% = SUM(sold at POS where brand counter > 0) / total sold × 100     ║
// ╚══════════════════════════════════════════════════════════════════════════╝
@Injectable({
  providedIn: 'root',
})
export class WsService extends ApiService {
  readonly endpoint = `${environment.apiUrl}/dashboard/weighted-sales`;

  // ── Private helper: build common HttpParams ───────────────────────────────
  private geoParams(p: WsGeoParams): HttpParams {
    let params = new HttpParams()
      .set('country_uuid', p.country_uuid)
      .set('start_date',   p.start_date)
      .set('end_date',     p.end_date);
    if (p.province_uuid)  params = params.set('province_uuid', p.province_uuid);
    if (p.area_uuid)      params = params.set('area_uuid',     p.area_uuid);
    if (p.sub_area_uuid)  params = params.set('sub_area_uuid', p.sub_area_uuid);
    if (p.commune_uuid)   params = params.set('commune_uuid',  p.commune_uuid);
    return params;
  }

  // ── Section 1 — Table Views ───────────────────────────────────────────────
  WsTableViewProvince(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-province`, { params: this.geoParams(p) });
  }
  WsTableViewArea(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-area`, { params: this.geoParams(p) });
  }
  WsTableViewSubArea(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-subarea`, { params: this.geoParams(p) });
  }
  WsTableViewCommune(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-commune`, { params: this.geoParams(p) });
  }

  // ── Section 2 — Bar Charts ────────────────────────────────────────────────
  WsBarChartProvince(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-province`, { params: this.geoParams(p) });
  }
  WsBarChartArea(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-area`, { params: this.geoParams(p) });
  }
  WsBarChartSubArea(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-subarea`, { params: this.geoParams(p) });
  }
  WsBarChartCommune(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-commune`, { params: this.geoParams(p) });
  }

  // ── Section 3 — Monthly Trend ─────────────────────────────────────────────
  WsLineChartByMonth(p: WsGeoParams, brand_uuid = ''): Observable<any> {
    const params = this.geoParams(p).set('brand_uuid', brand_uuid);
    return this.http.get<any>(`${this.endpoint}/line-chart-by-month`, { params });
  }

  // ── Section 4 — Power Analytics ──────────────────────────────────────────
  WsSummaryKPI(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/summary-kpi`, { params: this.geoParams(p) });
  }
  WsBrandRanking(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/brand-ranking`, { params: this.geoParams(p) });
  }
  WsGapAnalysis(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/gap-analysis`, { params: this.geoParams(p) });
  }

  // ── Section 5 — Advanced Analytics ───────────────────────────────────────
  WsHeatmap(p: WsGeoParams, level: string): Observable<any> {
    const params = this.geoParams(p).set('level', level);
    return this.http.get<any>(`${this.endpoint}/heatmap`, { params });
  }

  WsEvolution(p: WsGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/evolution`, { params: this.geoParams(p) });
  }

  WsVsNDCorrelation(p: WsGeoParams, threshold = 50): Observable<any> {
    const params = this.geoParams(p).set('threshold', threshold.toString());
    return this.http.get<any>(`${this.endpoint}/vs-nd-correlation`, { params });
  }

  WsPosDrillDown(p: WsGeoParams, brand_uuid: string): Observable<any> {
    const params = this.geoParams(p).set('brand_uuid', brand_uuid);
    return this.http.get<any>(`${this.endpoint}/pos-drill-down`, { params });
  }
}
