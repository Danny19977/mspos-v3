import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { HttpParams } from '@angular/common/http';

// ── Shared geo param builder ──────────────────────────────────────────────────
type GeoParams = {
  country_uuid:   string;
  province_uuid?: string;
  area_uuid?:     string;
  sub_area_uuid?: string;
  commune_uuid?:  string;
  start_date:     string;
  end_date:       string;
};

@Injectable({
  providedIn: 'root'
})
export class OosService extends ApiService {
  readonly endpoint = `${environment.apiUrl}/dashboard/out-of-stock`;

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
  OosTableViewProvince(p: GeoParams):  Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-province`,  { params: this.geoParams(p) }); }
  OosTableViewArea(p: GeoParams):      Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-area`,      { params: this.geoParams(p) }); }
  OosTableViewSubArea(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-subarea`,   { params: this.geoParams(p) }); }
  OosTableViewCommune(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/table-view-commune`,   { params: this.geoParams(p) }); }

  // ── Section 2 — Bar Charts ──────────────────────────────────────────────────
  OosBarChartProvince(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-province`,   { params: this.geoParams(p) }); }
  OosBarChartArea(p: GeoParams):       Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-area`,       { params: this.geoParams(p) }); }
  OosBarChartSubArea(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-subarea`,    { params: this.geoParams(p) }); }
  OosBarChartCommune(p: GeoParams):    Observable<any> { return this.http.get<any>(`${this.endpoint}/bar-chart-commune`,    { params: this.geoParams(p) }); }

  // ── Section 3 — Monthly Trend ───────────────────────────────────────────────
  OosLineChartByMonth(p: GeoParams):   Observable<any> { return this.http.get<any>(`${this.endpoint}/line-chart-by-month`,  { params: this.geoParams(p) }); }

  // ── Section 4 — Power Analytics ────────────────────────────────────────────
  OosSummaryKPI(p: GeoParams):         Observable<any> { return this.http.get<any>(`${this.endpoint}/summary-kpi`,          { params: this.geoParams(p) }); }
  OosBrandRanking(p: GeoParams):       Observable<any> { return this.http.get<any>(`${this.endpoint}/brand-ranking`,        { params: this.geoParams(p) }); }
  OosCriticalAlert(p: GeoParams):      Observable<any> { return this.http.get<any>(`${this.endpoint}/critical-alert`,       { params: this.geoParams(p) }); }

  // ── Section 5 — Advanced ────────────────────────────────────────────────────
  OosHeatmap(p: GeoParams, level: string): Observable<any> {
    const params = this.geoParams(p).set('level', level);
    return this.http.get<any>(`${this.endpoint}/heatmap`, { params });
  }
  OosEvolution(p: GeoParams):          Observable<any> { return this.http.get<any>(`${this.endpoint}/evolution`,            { params: this.geoParams(p) }); }
}
