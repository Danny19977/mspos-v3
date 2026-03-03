import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../shared/services/api.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KpiService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/kpi`;


  // ── Advanced KPI Endpoints ─────────────────────────────────────────────────

  /** Territory-level performance overview (multi-level: province|area|subarea|commune) */
  TerritoryOverview(params: {
    level?: string;
    territory_uuid?: string;
    start_date: string;
    end_date: string;
    sort_by?: string;
    limit?: number;
  }): Observable<any> {
    let p = new HttpParams()
      .set('start_date', params.start_date)
      .set('end_date',   params.end_date);
    if (params.level)          p = p.set('level',          params.level);
    if (params.territory_uuid) p = p.set('territory_uuid', params.territory_uuid);
    if (params.sort_by)        p = p.set('sort_by',        params.sort_by);
    if (params.limit != null)  p = p.set('limit',          String(params.limit));
    return this.http.get<any>(`${this.endpoint}/territory-overview`, { params: p });
  }

  /** Individual agent performance breakdown (daily breakdown optional) */
  AgentPerformance(params: {
    agent_uuid: string;
    start_date: string;
    end_date: string;
    include_daily?: boolean;
  }): Observable<any> {
    let p = new HttpParams()
      .set('agent_uuid',    params.agent_uuid)
      .set('start_date',    params.start_date)
      .set('end_date',      params.end_date)
      .set('include_daily', params.include_daily !== false ? 'true' : 'false');
    return this.http.get<any>(`${this.endpoint}/agent-performance`, { params: p });
  }

  /** POS-level visit coverage for a commune */
  POSInsights(params: {
    commune_uuid: string;
    start_date: string;
    end_date: string;
    min_visits?: number;
  }): Observable<any> {
    let p = new HttpParams()
      .set('commune_uuid', params.commune_uuid)
      .set('start_date',   params.start_date)
      .set('end_date',     params.end_date);
    if (params.min_visits != null) p = p.set('min_visits', String(params.min_visits));
    return this.http.get<any>(`${this.endpoint}/pos-insights`, { params: p });
  }

  /** Actual visits vs computed targets per territory */
  TargetVsActual(params: {
    level?: string;
    start_date: string;
    end_date: string;
  }): Observable<any> {
    let p = new HttpParams()
      .set('start_date', params.start_date)
      .set('end_date',   params.end_date);
    if (params.level) p = p.set('level', params.level);
    return this.http.get<any>(`${this.endpoint}/target-vs-actual`, { params: p });
  }

  /** Inactive agents alert list */
  AbsenceAnalysis(params: { days_inactive?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.days_inactive != null) p = p.set('days_inactive', String(params.days_inactive));
    return this.http.get<any>(`${this.endpoint}/absence-analysis`, { params: p });
  }

  /** Weekly / monthly visit trend for N past periods */
  PeriodComparison(params: {
    period?: 'weekly' | 'monthly';
    periods?: number;
  } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.period)  p = p.set('period',  params.period);
    if (params.periods) p = p.set('periods', String(params.periods));
    return this.http.get<any>(`${this.endpoint}/period-comparison`, { params: p });
  }

  /** Numeric-distribution density analysis by territory level */
  NDAnalysis(params: {
    level?: string;
    start_date: string;
    end_date: string;
  }): Observable<any> {
    let p = new HttpParams()
      .set('start_date', params.start_date)
      .set('end_date',   params.end_date);
    if (params.level) p = p.set('level', params.level);
    return this.http.get<any>(`${this.endpoint}/nd-analysis`, { params: p });
  }

  // ── Table-View + User-Summary Endpoints ──────────────────────────────────
  // Handlers: TotalVisitsByCountry/Province/Area/SubArea/Commune + KpiUserVisitSummary
  // Required Go routes to add in the kp group:
  //   kp.Get("/table-view/country",  dashboard.TotalVisitsByCountry)
  //   kp.Get("/table-view/province", dashboard.TotalVisitsByProvince)
  //   kp.Get("/table-view/area",     dashboard.TotalVisitsByArea)
  //   kp.Get("/table-view/sub-area", dashboard.TotalVisitsBySubArea)
  //   kp.Get("/table-view/commune",  dashboard.TotalVisitsByCommune)
  //   kp.Get("/user-visit-summary",  dashboard.KpiUserVisitSummary)

  private buildTvParams(p: KpiTableViewParams): HttpParams {
    let hp = new HttpParams()
      .set('country_uuid', p.country_uuid)
      .set('start_date',   p.start_date)
      .set('end_date',     p.end_date);
    if (p.province_uuid)  hp = hp.set('province_uuid',  p.province_uuid);
    if (p.area_uuid)      hp = hp.set('area_uuid',      p.area_uuid);
    if (p.sub_area_uuid)  hp = hp.set('sub_area_uuid',  p.sub_area_uuid);
    if (p.commune_uuid)   hp = hp.set('commune_uuid',   p.commune_uuid);
    if (p.title)          hp = hp.set('title',          p.title);
    if (p.user_uuid)      hp = hp.set('user_uuid',      p.user_uuid);
    return hp;
  }

  /** Visits grouped by province — needs: country_uuid */
  TableViewCountry(params: KpiTableViewParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view/country`, { params: this.buildTvParams(params) });
  }

  /** Visits grouped by area — needs: country_uuid + province_uuid */
  TableViewProvince(params: KpiTableViewParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view/province`, { params: this.buildTvParams(params) });
  }

  /** Visits grouped by sub-area — needs: country_uuid + province_uuid */
  TableViewArea(params: KpiTableViewParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view/area`, { params: this.buildTvParams(params) });
  }

  /** Visits grouped by commune — needs: country_uuid + province_uuid + area_uuid */
  TableViewSubArea(params: KpiTableViewParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view/sub-area`, { params: this.buildTvParams(params) });
  }

  /** Visits grouped by commune/agent — needs: country_uuid + province_uuid + area_uuid + sub_area_uuid */
  TableViewCommune(params: KpiTableViewParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/table-view/commune`, { params: this.buildTvParams(params) });
  }

  /** Per-agent visit summary (daily/monthly/yearly/range) — needs: country_uuid */
  UserVisitSummary(params: KpiTableViewParams): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/user-visit-summary`, { params: this.buildTvParams(params) });
  }
}

/** Shared params for all table-view + user-summary endpoints */
export interface KpiTableViewParams {
  country_uuid:  string;
  province_uuid?: string;
  area_uuid?:     string;
  sub_area_uuid?: string;
  commune_uuid?:  string;
  start_date:    string;
  end_date:      string;
  title?:        string;
  user_uuid?:    string;
}
