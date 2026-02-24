import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleEvolutionService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/sales-evolution`;

  // ─── SECTION 1 — TypePos Table Views ────────────────────────────────────────

  TableViewProvince(country_uuid: string, province_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-province`, { params });
  }

  TableViewArea(country_uuid: string, province_uuid: string, area_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('area_uuid', area_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-area`, { params });
  }

  TableViewSubArea(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('area_uuid', area_uuid)
      .set('sub_area_uuid', sub_area_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-subarea`, { params });
  }

  TableViewCommune(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string, commune_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('area_uuid', area_uuid)
      .set('sub_area_uuid', sub_area_uuid)
      .set('commune_uuid', commune_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-commune`, { params });
  }

  // ─── SECTION 2 — Price Analysis Tables ──────────────────────────────────────

  TableViewProvincePrice(country_uuid: string, province_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-province-price`, { params });
  }

  TableViewAreaPrice(country_uuid: string, province_uuid: string, area_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('area_uuid', area_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-area-price`, { params });
  }

  TableViewSubAreaPrice(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('area_uuid', area_uuid)
      .set('sub_area_uuid', sub_area_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-subarea-price`, { params });
  }

  TableViewCommunePrice(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string, commune_uuid: string, start_date: string, end_date: string): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('area_uuid', area_uuid)
      .set('sub_area_uuid', sub_area_uuid)
      .set('commune_uuid', commune_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    return this.http.get<any>(`${this.endpoint}/table-view-commune-price`, { params });
  }

  // ─── SECTION 3 — Monthly Sales Evolution ────────────────────────────────────

  SalesEvolutionByMonth(
    country_uuid: string, start_date: string, end_date: string,
    province_uuid = '', area_uuid = '', sub_area_uuid = '', commune_uuid = '', brand_uuid = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    if (province_uuid)  params = params.set('province_uuid', province_uuid);
    if (area_uuid)      params = params.set('area_uuid', area_uuid);
    if (sub_area_uuid)  params = params.set('sub_area_uuid', sub_area_uuid);
    if (commune_uuid)   params = params.set('commune_uuid', commune_uuid);
    if (brand_uuid)     params = params.set('brand_uuid', brand_uuid);
    return this.http.get<any>(`${this.endpoint}/evolution-by-month`, { params });
  }

  // ─── SECTION 4 — Period-over-Period Growth Rate ──────────────────────────────

  SalesGrowthRate(
    country_uuid: string, curr_start: string, curr_end: string, prev_start: string, prev_end: string,
    province_uuid = '', area_uuid = '', sub_area_uuid = '', commune_uuid = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('curr_start', curr_start)
      .set('curr_end', curr_end)
      .set('prev_start', prev_start)
      .set('prev_end', prev_end);
    if (province_uuid)  params = params.set('province_uuid', province_uuid);
    if (area_uuid)      params = params.set('area_uuid', area_uuid);
    if (sub_area_uuid)  params = params.set('sub_area_uuid', sub_area_uuid);
    if (commune_uuid)   params = params.set('commune_uuid', commune_uuid);
    return this.http.get<any>(`${this.endpoint}/growth-rate`, { params });
  }

  // ─── SECTION 5 — Brand Competition Matrix ───────────────────────────────────

  BrandCompetitionMatrix(
    country_uuid: string, province_uuid: string, start_date: string, end_date: string,
    level = 'province', area_uuid = '', sub_area_uuid = '', commune_uuid = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('province_uuid', province_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date)
      .set('level', level);
    if (area_uuid)      params = params.set('area_uuid', area_uuid);
    if (sub_area_uuid)  params = params.set('sub_area_uuid', sub_area_uuid);
    if (commune_uuid)   params = params.set('commune_uuid', commune_uuid);
    return this.http.get<any>(`${this.endpoint}/brand-competition-matrix`, { params });
  }

  // ─── SECTION 6 — Top POS Ranking ────────────────────────────────────────────

  TopPOSRanking(
    country_uuid: string, start_date: string, end_date: string,
    province_uuid = '', area_uuid = '', sub_area_uuid = '', commune_uuid = '', limit = '10'
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date)
      .set('limit', limit);
    if (province_uuid)  params = params.set('province_uuid', province_uuid);
    if (area_uuid)      params = params.set('area_uuid', area_uuid);
    if (sub_area_uuid)  params = params.set('sub_area_uuid', sub_area_uuid);
    if (commune_uuid)   params = params.set('commune_uuid', commune_uuid);
    return this.http.get<any>(`${this.endpoint}/top-pos-ranking`, { params });
  }

  // ─── SECTION 7 — Sales Rep Scorecard ────────────────────────────────────────

  SalesRepScorecard(
    country_uuid: string, start_date: string, end_date: string,
    province_uuid = '', area_uuid = '', sub_area_uuid = '', commune_uuid = '', title = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    if (province_uuid)  params = params.set('province_uuid', province_uuid);
    if (area_uuid)      params = params.set('area_uuid', area_uuid);
    if (sub_area_uuid)  params = params.set('sub_area_uuid', sub_area_uuid);
    if (commune_uuid)   params = params.set('commune_uuid', commune_uuid);
    if (title)          params = params.set('title', title);
    return this.http.get<any>(`${this.endpoint}/rep-scorecard`, { params });
  }

  // ─── SECTION 8 — Day-of-Week Heatmap ────────────────────────────────────────

  SalesHeatmapByDayOfWeek(
    country_uuid: string, start_date: string, end_date: string,
    province_uuid = '', area_uuid = '', sub_area_uuid = '', commune_uuid = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    if (province_uuid)  params = params.set('province_uuid', province_uuid);
    if (area_uuid)      params = params.set('area_uuid', area_uuid);
    if (sub_area_uuid)  params = params.set('sub_area_uuid', sub_area_uuid);
    if (commune_uuid)   params = params.set('commune_uuid', commune_uuid);
    return this.http.get<any>(`${this.endpoint}/heatmap-day-of-week`, { params });
  }

  // ─── SECTION 9 — Summary KPI Card ───────────────────────────────────────────

  SalesSummaryKPI(
    country_uuid: string, start_date: string, end_date: string,
    province_uuid = '', area_uuid = '', sub_area_uuid = '', commune_uuid = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('country_uuid', country_uuid)
      .set('start_date', start_date)
      .set('end_date', end_date);
    if (province_uuid)  params = params.set('province_uuid', province_uuid);
    if (area_uuid)      params = params.set('area_uuid', area_uuid);
    if (sub_area_uuid)  params = params.set('sub_area_uuid', sub_area_uuid);
    if (commune_uuid)   params = params.set('commune_uuid', commune_uuid);
    return this.http.get<any>(`${this.endpoint}/summary-kpi`, { params });
  }
}
