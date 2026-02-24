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
export class NdService extends ApiService {
  readonly endpoint = `${environment.apiUrl}/dashboard/numeric-distribution`;

  private geoParams(p: GeoParams): HttpParams {
    return new HttpParams()
      .set('country_uuid',  p.country_uuid)
      .set('province_uuid', p.province_uuid  ?? '')
      .set('area_uuid',     p.area_uuid      ?? '')
      .set('sub_area_uuid', p.sub_area_uuid  ?? '')
      .set('commune_uuid',  p.commune_uuid   ?? '')
      .set('start_date',    p.start_date)
      .set('end_date',      p.end_date);
  }

  // ── Section 1 — Table Views ─────────────────────────────────────────────────
  NdTableViewProvince(p: GeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-province`,  { params: this.geoParams(p) }); }
  NdTableViewArea(p: GeoParams):      Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-area`,      { params: this.geoParams(p) }); }
  NdTableViewSubArea(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-subarea`,   { params: this.geoParams(p) }); }
  NdTableViewCommune(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-commune`,   { params: this.geoParams(p) }); }

  // ── Section 2 — Bar Charts ──────────────────────────────────────────────────
  NdBarChartProvince(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-province`,   { params: this.geoParams(p) }); }
  NdBarChartArea(p: GeoParams):       Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-area`,       { params: this.geoParams(p) }); }
  NdBarChartSubArea(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-subarea`,    { params: this.geoParams(p) }); }
  NdBarChartCommune(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-commune`,    { params: this.geoParams(p) }); }

  // ── Section 3 — Monthly Trend ───────────────────────────────────────────────
  NdLineChartByMonth(p: GeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/line-chart-by-month`, { params: this.geoParams(p) });
  }

  // ── Section 4 — Power Analytics ────────────────────────────────────────────
  NdSummaryKPI(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/summary-kpi`,    { params: this.geoParams(p) }); }
  NdBrandRanking(p: GeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/brand-ranking`,  { params: this.geoParams(p) }); }
  NdGapAnalysis(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/gap-analysis`,   { params: this.geoParams(p) }); }

  // ── Section 5 — Advanced ────────────────────────────────────────────────────
  NdHeatmap(p: GeoParams, level: string): Observable<any> {
    const params = this.geoParams(p).set('level', level);
    return this.http.get<any>(`${this.endpoint}/heatmap`, { params });
  }
  NdEvolution(p: GeoParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/evolution`, { params: this.geoParams(p) });
  }
}
