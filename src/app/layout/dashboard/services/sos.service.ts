import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';

// ── Shared geo-filter param type ───────────────────────────────────────────────
export type SosGeoParams = {
  country_uuid:   string;
  province_uuid?: string;
  area_uuid?:     string;
  sub_area_uuid?: string;
  commune_uuid?:  string;
  start_date:     string;
  end_date:       string;
};

@Injectable({ providedIn: 'root' })
export class SosService extends ApiService {
  readonly endpoint = `${environment.apiUrl}/dashboard/share-of-stock`;

  // ── Internal param builder ─────────────────────────────────────────────────
  private geoParams(p: SosGeoParams): HttpParams {
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

// ── Section 1 — Table Views ────────────────────────────────────────────────
  SosTableViewProvince(p: SosGeoParams): Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-province`, { params: this.geoParams(p) }); }
  SosTableViewArea(p: SosGeoParams):     Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-area`,     { params: this.geoParams(p) }); }
  SosTableViewSubArea(p: SosGeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-subarea`,  { params: this.geoParams(p) }); }
  SosTableViewCommune(p: SosGeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-commune`,  { params: this.geoParams(p) }); }

  // ── Section 2 — Bar Charts ─────────────────────────────────────────────────
  SosBarChartProvince(p: SosGeoParams): Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-province`, { params: this.geoParams(p) }); }
  SosBarChartArea(p: SosGeoParams):     Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-area`,     { params: this.geoParams(p) }); }
  SosBarChartSubArea(p: SosGeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-subarea`,  { params: this.geoParams(p) }); }
  SosBarChartCommune(p: SosGeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-commune`,  { params: this.geoParams(p) }); }

  // ── Section 3 — Monthly Trend ──────────────────────────────────────────────
  SosLineChartByMonth(p: SosGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/line-chart-by-month`, { params: this.geoParams(p) });
  }

  // ── Section 4 — Power Analytics ───────────────────────────────────────────
  SosSummaryKPI(p: SosGeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/summary-kpi`,   { params: this.geoParams(p) }); }
  SosBrandRanking(p: SosGeoParams): Observable<any> { return this.http.get<any>(`${this.endpoint}/brand-ranking`, { params: this.geoParams(p) }); }
  SosConcentrationIndex(p: SosGeoParams, level: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/concentration-index`, { params: this.geoParams(p).set('level', level) });
  }

  // ── Section 5 — Advanced Analytics ────────────────────────────────────────
  SosHeatmap(p: SosGeoParams, level: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/heatmap`, { params: this.geoParams(p).set('level', level) });
  }
  SosEvolution(p: SosGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/evolution`, { params: this.geoParams(p) });
  }
  SosGapAnalysis(p: SosGeoParams, target?: number): Observable<any> {
    let params = this.geoParams(p);
    if (target != null) params = params.set('target', target.toString());
    return this.http.get<any>(`${this.endpoint}/gap-analysis`, { params });
  }
  SosPosDrillDown(p: SosGeoParams, brand_uuid: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/pos-drill-down`, { params: this.geoParams(p).set('brand_uuid', brand_uuid) });
  }
  SosVsNDCorrelation(p: SosGeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/vs-nd-correlation`, { params: this.geoParams(p) });
  }
}

