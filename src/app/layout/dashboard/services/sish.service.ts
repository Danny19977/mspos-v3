import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';

// ── Shared geo param type ─────────────────────────────────────────────────────
export type SishGeoParams = {
  country_uuid:  string;
  province_uuid?: string;
  area_uuid?:     string;
  sub_area_uuid?: string;
  commune_uuid?:  string;
  start_date:    string;
  end_date:      string;
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SishService — Share In Shop (SISH) Dashboard API client                ║
// ║  Endpoint: /dashboard/share-in-shop                                     ║
// ║  SISH%    = SUM(brand_sold) / SUM(total_sold) × 100                    ║
// ║  Velocity = SISH% / SOS%   (>1: fast mover | <1: slow mover)           ║
// ╚══════════════════════════════════════════════════════════════════════════╝
@Injectable({
  providedIn: 'root',
})
export class SishService extends ApiService {
  readonly endpoint = `${environment.apiUrl}/dashboard/share-in-shop`;

  // ── Private helper: build common HttpParams ───────────────────────────────
  private geoParams(p: SishGeoParams): HttpParams {
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
  SishTableViewProvince(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-province`, { params: this.geoParams(p) });
  }
  SishTableViewArea(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-area`, { params: this.geoParams(p) });
  }
  SishTableViewSubArea(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-subarea`, { params: this.geoParams(p) });
  }
  SishTableViewCommune(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view-commune`, { params: this.geoParams(p) });
  }

  // ── Section 2 — Bar Charts ────────────────────────────────────────────────
  SishBarChartProvince(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-province`, { params: this.geoParams(p) });
  }
  SishBarChartArea(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-area`, { params: this.geoParams(p) });
  }
  SishBarChartSubArea(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-subarea`, { params: this.geoParams(p) });
  }
  SishBarChartCommune(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/bar-chart-commune`, { params: this.geoParams(p) });
  }

  // ── Section 3 — Monthly Trend ─────────────────────────────────────────────
  SishLineChartByMonth(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/line-chart-by-month`, { params: this.geoParams(p) });
  }

  // ── Section 4 — Power Analytics ──────────────────────────────────────────
  SishSummaryKPI(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/summary-kpi`, { params: this.geoParams(p) });
  }
  SishBrandRanking(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/brand-ranking`, { params: this.geoParams(p) });
  }
  SishVelocityIndex(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/velocity-index`, { params: this.geoParams(p) });
  }

  // ── Section 5 — Advanced Analytics ───────────────────────────────────────
  SishHeatmap(p: SishGeoParams, level: string): Observable<any> {
    const params = this.geoParams(p).set('level', level);
    return this.http.get<any>(`${this.endpoint}/heatmap`, { params });
  }
  SishEvolution(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/evolution`, { params: this.geoParams(p) });
  }
  SishGapAnalysis(p: SishGeoParams, target?: number): Observable<any> {
    let params = this.geoParams(p);
    if (target !== undefined) params = params.set('target', target.toString());
    return this.http.get<any>(`${this.endpoint}/gap-analysis`, { params });
  }
  SishVsSosCorrelation(p: SishGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/vs-sos-correlation`, { params: this.geoParams(p) });
  }
  SishPosDrillDown(p: SishGeoParams, brand_uuid: string): Observable<any> {
    const params = this.geoParams(p).set('brand_uuid', brand_uuid);
    return this.http.get<any>(`${this.endpoint}/pos-drill-down`, { params });
  }
}
