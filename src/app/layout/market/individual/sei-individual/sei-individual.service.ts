import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface SeiSummaryKPI {
  user_uuid: string;
  fullname: string;
  total_farde: number;
  total_sold: number;
  total_visits: number;
  active_pos: number;
  brands_covered: number;
  avg_price: number;
  active_days: number;
}

export interface SeiPosType {
  pos_type: string;
  total_visits: number;
  total_pos: number;
  total_farde: number;
  total_sold: number;
  avg_farde_per_visit: number;
  avg_sold_per_visit: number;
  market_share_farde: number;
  market_share_sold: number;
}

export interface SeiPriceBrand {
  brand_uuid: string;
  brand_name: string;
  total_visits: number;
  total_pos: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  total_farde: number;
  total_sold: number;
  revenue_share: number;
}

export interface SeiMonthly {
  year_month: string;
  brand_name: string;
  total_visits: number;
  total_pos: number;
  total_farde: number;
  total_sold: number;
  growth_farde_pct: number;
  growth_sold_pct: number;
}

export interface SeiGrowth {
  brand_name: string;
  curr_farde: number;
  prev_farde: number;
  delta_farde: number;
  growth_farde_pct: number;
  curr_sold: number;
  prev_sold: number;
  delta_sold: number;
  growth_sold_pct: number;
  curr_visits: number;
  prev_visits: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface SeiBrandComp {
  brand_uuid: string;
  brand_name: string;
  total_farde: number;
  total_sold: number;
  market_share: number;
  brand_rank: number;
  total_visits: number;
}

export interface SeiTopPos {
  rank: number;
  pos_uuid: string;
  pos_name: string;
  shop: string;
  postype: string;
  commune_name: string;
  total_visits: number;
  total_farde: number;
  total_sold: number;
  avg_price: number;
  farde_share: number;
}

export interface SeiHeatmap {
  day_of_week: number;
  day_name: string;
  brand_name: string;
  total_farde: number;
  total_sold: number;
  total_visits: number;
  avg_farde: number;
}

export interface SeiPriceSlice {
  price: number;
  count: number;
  share_pct: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SeiIndividualService {
  private readonly base = `${environment.apiUrl}/sales-evolution-individual`;

  constructor(private http: HttpClient) {}

  getSummaryKPI(uid: string, s: string, e: string): Observable<{ status: string; data: SeiSummaryKPI }> {
    const params = new HttpParams().set('start_date', s).set('end_date', e);
    return this.http.get<{ status: string; data: SeiSummaryKPI }>(
      `${this.base}/summary-kpi/${uid}`, { params }
    );
  }

  getByPosType(uid: string, s: string, e: string): Observable<{ status: string; data: SeiPosType[] }> {
    const params = new HttpParams().set('start_date', s).set('end_date', e);
    return this.http.get<{ status: string; data: SeiPosType[] }>(
      `${this.base}/by-pos-type/${uid}`, { params }
    );
  }

  getPriceByBrand(uid: string, s: string, e: string): Observable<{ status: string; data: SeiPriceBrand[] }> {
    const params = new HttpParams().set('start_date', s).set('end_date', e);
    return this.http.get<{ status: string; data: SeiPriceBrand[] }>(
      `${this.base}/price-by-brand/${uid}`, { params }
    );
  }

  getEvolutionByMonth(uid: string, s: string, e: string, brandUuid?: string): Observable<{ status: string; data: SeiMonthly[] }> {
    let params = new HttpParams().set('start_date', s).set('end_date', e);
    if (brandUuid) { params = params.set('brand_uuid', brandUuid); }
    return this.http.get<{ status: string; data: SeiMonthly[] }>(
      `${this.base}/evolution-by-month/${uid}`, { params }
    );
  }

  getGrowthRate(
    uid: string,
    currStart: string, currEnd: string,
    prevStart: string, prevEnd: string
  ): Observable<{ status: string; data: SeiGrowth[] }> {
    const params = new HttpParams()
      .set('curr_start', currStart).set('curr_end', currEnd)
      .set('prev_start', prevStart).set('prev_end', prevEnd);
    return this.http.get<{ status: string; data: SeiGrowth[] }>(
      `${this.base}/growth-rate/${uid}`, { params }
    );
  }

  getBrandCompetition(uid: string, s: string, e: string): Observable<{ status: string; data: SeiBrandComp[] }> {
    const params = new HttpParams().set('start_date', s).set('end_date', e);
    return this.http.get<{ status: string; data: SeiBrandComp[] }>(
      `${this.base}/brand-competition/${uid}`, { params }
    );
  }

  getTopPos(uid: string, s: string, e: string, limit = 10): Observable<{ status: string; data: SeiTopPos[] }> {
    const params = new HttpParams()
      .set('start_date', s).set('end_date', e)
      .set('limit', limit.toString());
    return this.http.get<{ status: string; data: SeiTopPos[] }>(
      `${this.base}/top-pos/${uid}`, { params }
    );
  }

  getHeatmap(uid: string, s: string, e: string): Observable<{ status: string; data: SeiHeatmap[] }> {
    const params = new HttpParams().set('start_date', s).set('end_date', e);
    return this.http.get<{ status: string; data: SeiHeatmap[] }>(
      `${this.base}/heatmap-day-of-week/${uid}`, { params }
    );
  }

  getPricePieChart(uid: string, s: string, e: string): Observable<{ status: string; data: SeiPriceSlice[] }> {
    const params = new HttpParams().set('start_date', s).set('end_date', e);
    return this.http.get<{ status: string; data: SeiPriceSlice[] }>(
      `${this.base}/price-pie-chart/${uid}`, { params }
    );
  }
}
