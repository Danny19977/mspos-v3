import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { HttpParams } from '@angular/common/http';

// ── Shared geo param builder ──────────────────────────────────────────────────
type GeoParams = {
  country_uuid: string;
  province_uuid?: string;
  area_uuid?: string;
  sub_area_uuid?: string;
  commune_uuid?: string;
  start_date: string;
  end_date: string;
};

@Injectable({
  providedIn: 'root'
})
export class WdService extends ApiService {
  readonly endpoint = `${environment.apiUrl}/dashboard/weighted-distribution`;

  private geoParams(p: GeoParams): HttpParams {
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

  // ── Section 1 — Table Views ─────────────────────────────────────────────────
  WdTableViewProvince(p: GeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-province`,  { params: this.geoParams(p) }); }
  WdTableViewArea(p: GeoParams):      Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-area`,      { params: this.geoParams(p) }); }
  WdTableViewSubArea(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-subarea`,   { params: this.geoParams(p) }); }
  WdTableViewCommune(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-commune`,   { params: this.geoParams(p) }); }

  // ── Section 2 — Bar Charts ──────────────────────────────────────────────────
  WdBarChartProvince(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-province`,   { params: this.geoParams(p) }); }
  WdBarChartArea(p: GeoParams):       Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-area`,       { params: this.geoParams(p) }); }
  WdBarChartSubArea(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-subarea`,    { params: this.geoParams(p) }); }
  WdBarChartCommune(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-commune`,    { params: this.geoParams(p) }); }

  // ── Section 3 — Monthly Trend ───────────────────────────────────────────────
  WdLineChartByMonth(p: GeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/line-chart-by-month`, { params: this.geoParams(p) });
  }

  // ── Section 4 — Power Analytics ────────────────────────────────────────────
  WdSummaryKPI(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/summary-kpi`,    { params: this.geoParams(p) }); }
  WdBrandRanking(p: GeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/brand-ranking`,  { params: this.geoParams(p) }); }
  WdGapAnalysis(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/gap-analysis`,   { params: this.geoParams(p) }); }

  // ── Section 5 — Advanced Analytics ─────────────────────────────────────────
  WdHeatmap(p: GeoParams, level: string): Observable<any> {
    const params = this.geoParams(p).set('level', level);
    return this.http.get<any>(`${this.endpoint}/heatmap`, { params });
  }

  WdEvolution(p: GeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/evolution`, { params: this.geoParams(p) });
  }

  WdVsNDCorrelation(p: GeoParams, threshold = 50): Observable<any> {
    const params = this.geoParams(p).set('threshold', threshold.toString());
    return this.http.get<any>(`${this.endpoint}/vs-nd-correlation`, { params });
  }

  WdPosDrillDown(p: GeoParams, brand_uuid: string): Observable<any> {
    const params = this.geoParams(p).set('brand_uuid', brand_uuid);
    return this.http.get<any>(`${this.endpoint}/pos-drill-down`, { params });
  }
}
