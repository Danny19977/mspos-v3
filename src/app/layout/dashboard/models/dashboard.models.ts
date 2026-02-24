
export interface TableViewModel {
    uuid: string;
    name: string;
    brand: string;
    pourcent: number;
    presence: number;
    visits: number;
}
export interface NDYearModel {
    month: string;
    brand: string;
    pourcent: number;
    presence: number;
    visits: number;
}

export interface NDBarChartProvinceModel {
    name: string;
    brands: {
        brand: string;
        presence: number;
        pourcent: number;
    }[];
    total_visits: number;
}

export interface NDBarChartAreaModel {
    name: string;
    brands: {
        brand: string;
        presence: number;
        pourcent: number;
    }[];
    total_visits: number;
}

export interface NDBarChartSubAreaModel {
    name: string;
    brands: {
        brand: string;
        presence: number;
        pourcent: number;
    }[];
    total_visits: number;
}

export interface NDBarChartCommuneModel {
    name: string;
    brands: {
        brand: string;
        presence: number;
        pourcent: number;
    }[];
    total_visits: number;
}

export interface SOSBarChartProvinceModel {
    name: string;
    brands: {
        brand_name: string;
        total_farde: number;
        total_global_farde: number;
        percentage: number;
    }[];
    total_pos: number;
}

export interface SOSBarChartAreaModel {
    name: string;
    brands: {
        brand_name: string;
        total_farde: number;
        total_global_farde: number;
        percentage: number;
    }[];
    total_pos: number;
}

export interface SOSBarChartSubAreaModel {
  name: string;
  brands: {
    brand_name: string;
    total_farde: number;
    total_global_farde: number;
    percentage: number;
  }[];
  total_pos: number;
}

export interface SOSBarChartCommuneModel {
  name: string;
  brands: {
    brand_name: string;
    total_farde: number;
    total_global_farde: number;
    percentage: number;
  }[];
  total_pos: number;
}
export interface SOSTableViewModel {
    uuid: string;
    name: string;
    brand_name: string;
    percentage: number;
    total_farde: number;
    total_global_farde: number;
    total_pos: number;
}
export interface SOSYearModel {
    brand_name: string;
    month: string;
    total_farde: number;
    total_global_farde: number;
    percentage: number;
    total_pos: number;
}


export interface GoogleMapModel {
    latitude:      number;
    longitude:     number;
    signature:     string;
    pos_uuid:      string;
    pos_name:      string;
    postype:       string;
    asm:           string;
    sup:           string;
    dr:            string;
    cyclo:         string;
    role:          string;   // 'asm' | 'supervisor' | 'dr' | 'cyclo' | 'unknown'
    province_uuid: string;
    province_name: string;
    created_at:    string;
}


export interface SETableViewModel {
    uuid: string;
    name: string;
    type_pos: string;
    total_pos: number;
}

export interface SETableViewPriceModel {
    uuid: string;
    name: string;
    price: string;
    count_price: number;
    sold: number;
}

// ─── Sales Evolution Dashboard Models ────────────────────────────────────────

export interface SETypePosTableModel {
    province_name?: string;
    province_uuid?: string;
    area_name?: string;
    area_uuid?: string;
    sub_area_name?: string;
    sub_area_uuid?: string;
    commune_name?: string;
    commune_uuid?: string;
    pos_type: string;
    total_visits: number;
    total_pos: number;
    total_farde: number;
    total_sold: number;
    total_revenue: number;
    avg_farde_per_visit: number;
    avg_sold_per_visit: number;
    market_share_farde: number;
    market_share_sold: number;
}

export interface SEPriceTableModel {
    province_name?: string;
    province_uuid?: string;
    area_name?: string;
    area_uuid?: string;
    sub_area_name?: string;
    sub_area_uuid?: string;
    commune_name?: string;
    commune_uuid?: string;
    brand_name: string;
    total_visits: number;
    total_pos: number;
    total_revenue: number;
    avg_price: number;
    min_price: number;
    max_price: number;
    total_farde: number;
    total_sold: number;
    revenue_share: number;
}

export interface SEMonthlyEvolutionModel {
    year_month: string;
    brand_name: string;
    total_visits: number;
    total_pos: number;
    total_farde: number;
    total_sold: number;
    total_revenue: number;
    growth_farde_pct: number;
    growth_sold_pct: number;
}

export interface SEGrowthRateModel {
    brand_name: string;
    curr_farde: number;
    prev_farde: number;
    delta_farde: number;
    growth_farde_pct: number;
    curr_sold: number;
    prev_sold: number;
    delta_sold: number;
    growth_sold_pct: number;
    curr_revenue: number;
    prev_revenue: number;
    delta_revenue: number;
    growth_revenue_pct: number;
    curr_visits: number;
    prev_visits: number;
    trend: string; // "UP" | "DOWN" | "STABLE"
}

export interface SEBrandCompetitionModel {
    geo_name: string;
    geo_uuid: string;
    brand_name: string;
    total_farde: number;
    total_sold: number;
    market_share: number;
    brand_rank: number;
    total_visits: number;
}

export interface SETopPOSModel {
    rank: number;
    pos_name: string;
    pos_uuid: string;
    shop: string;
    postype: string;
    commune_name: string;
    area_name: string;
    total_visits: number;
    total_farde: number;
    total_sold: number;
    total_revenue: number;
    avg_price: number;
    farde_share: number;
}

export interface SESalesRepModel {
    agent_name: string;
    agent_uuid: string;
    title: string;
    total_visits: number;
    unique_pos: number;
    total_farde: number;
    total_sold: number;
    total_revenue: number;
    avg_farde_per_pos: number;
    avg_revenue_per_visit: number;
    brands_covered: number;
    visit_target: number;
    achievement_pct: number;
    perf_score: number;
}

export interface SEDayHeatmapModel {
    day_of_week: number;
    day_name: string;
    brand_name: string;
    total_farde: number;
    total_sold: number;
    total_visits: number;
    avg_farde: number;
}

export interface SEKpiSummary {
    current: {
        total_farde: number;
        total_sold: number;
        total_revenue: number;
        total_visits: number;
        active_pos: number;
        active_brands: number;
        avg_price: number;
        active_agents: number;
    };
    farde_growth_pct: number;
    sold_growth_pct: number;
    revenue_growth_pct: number;
    visits_growth_pct: number;
}

export interface KPITableViewPriceModel {
    uuid: string;
    name: string;
    province_uuid: string;
    area_uuid: string;
    sub_area_uuid: string;
    commune_uuid: string;
    signature: string;
    title: string;
    total_visits: number;
    objectif: number;
    target: number;
}

export interface KpiUserVisitSummaryModel {
    user_uuid: string;
    name: string;
    title: string;
    // Daily
    daily_visits: number;
    daily_target: number;
    daily_pct: number;
    // Monthly
    monthly_visits: number;
    monthly_target: number;
    monthly_pct: number;
    // Yearly
    yearly_visits: number;
    yearly_target: number;
    yearly_pct: number;
    // Selected date range
    total_visits: number;
    range_target: number;
    range_pct: number;
}

// ─── Numeric Distribution (ND) Dashboard Models ───────────────────────────────

/** Table view row — one brand × one territory */
export interface NDTableRowModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    brand_name:      string;
    brand_uuid:      string;
    nd_pos:          number;
    total_pos:       number;
    universe_pos:    number;
    nd_percent:      number;
    reach_rate:      number;
}

/** Brand item inside a bar-chart group */
export interface NDBrandItemModel {
    brand_name: string;
    brand_uuid: string;
    nd_pos:     number;
    total_pos:  number;
    nd_percent: number;
}

/** Bar-chart group (one territory containing N brands) */
export interface NDBarGroupModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    total_pos:       number;
    universe_pos:    number;
    reach_rate:      number;
    brands:          NDBrandItemModel[];
}

/** Monthly trend point per brand */
export interface NDMonthPointModel {
    brand_name: string;
    brand_uuid: string;
    month:      string;
    nd_pos:     number;
    total_pos:  number;
    nd_percent: number;
}

/** Brand series (trend line) */
export interface NDBrandSeriesModel {
    brand_name: string;
    brand_uuid: string;
    points:     NDMonthPointModel[];
}

/** KPI card data */
export interface NDSummaryKPIModel {
    total_universe_pos: number;
    total_visited_pos:  number;
    total_nd_pos:       number;
    avg_nd_percent:     number;
    total_brands:       number;
    reach_rate:         number;
    coverage_index:     number;
}

/** Brand ranking row */
export interface NDBrandRankModel {
    rank:        number;
    brand_name:  string;
    brand_uuid:  string;
    nd_pos:      number;
    total_pos:   number;
    nd_percent:  number;
    total_farde: number;
    avg_counter: number;
}

/** Gap analysis (3-zone funnel) per brand */
export interface NDGapRowModel {
    brand_name:       string;
    brand_uuid:       string;
    nd_pos:           number;
    visited_gap_pos:  number;
    universe_gap_pos: number;
    total_visited:    number;
    total_universe:   number;
    nd_percent:       number;
    reach_rate:       number;
    opportunity_pct:  number;
}

/** Period-over-period evolution per brand */
export interface NDEvolutionRowModel {
    brand_name:          string;
    brand_uuid:          string;
    current_nd_pos:      number;
    previous_nd_pos:     number;
    current_total_pos:   number;
    previous_total_pos:  number;
    current_nd_percent:  number;
    previous_nd_percent: number;
    delta:               number;
    trend:               'up' | 'down' | 'stable';
}

/** Heatmap response */
export interface NDHeatmapModel {
    brands:      { uuid: string; name: string }[];
    territories: { uuid: string; name: string }[];
    matrix:      number[][];
}

// ─── Out-Of-Stock (OOS) Dashboard Models ─────────────────────────────────────

/** Table view row — one brand × one territory */
export interface OOSTableRowModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    brand_name:      string;
    brand_uuid:      string;
    oos_pos:         number;
    coverage_pos:    number;
    total_pos:       number;
    oos_percent:     number;
    coverage_pct:    number;
}

/** Single data point inside an OOS bar-chart brand series */
export interface OOSBarSeriesPoint {
    territory_name: string;
    oos_percent:    number;
}

/** Brand series inside an OOS bar chart */
export interface OOSBarSeries {
    brand_name:  string;
    brand_uuid:  string;
    data:        OOSBarSeriesPoint[];
}

/** Full bar-chart response */
export interface OOSBarChartModel {
    categories: string[];
    series:     OOSBarSeries[];
}

/** Monthly OOS point per brand */
export interface OOSTrendPoint {
    month:       string;
    oos_percent: number;
}

/** Brand trend series (line chart) */
export interface OOSTrendSeries {
    brand_name:  string;
    brand_uuid:  string;
    data:        OOSTrendPoint[];
}

/** Full trend/line-chart response */
export interface OOSTrendChartModel {
    months:  string[];
    series:  OOSTrendSeries[];
}

/** KPI summary cards */
export interface OOSSummaryKPIModel {
    total_pos_visited:    number;
    total_oos_events:     number;
    avg_oos_percent:      number;
    most_affected_brand:  string;
    least_affected_brand: string;
    critical_threshold:   number;
}

/** Brand ranking row with severity */
export interface OOSBrandRankModel {
    rank:        number;
    brand_name:  string;
    brand_uuid:  string;
    oos_pos:     number;
    total_pos:   number;
    oos_percent: number;
    severity:    'critical' | 'high' | 'medium' | 'low';
}

/** Critical-alert hotspot (top-20, OOS% > 15) */
export interface OOSAlertModel {
    brand_name:      string;
    brand_uuid:      string;
    territory_name:  string;
    oos_percent:     number;
    severity:        'critical' | 'high' | 'medium' | 'low';
}

/** Period-over-period evolution per brand */
export interface OOSEvolutionRowModel {
    brand_name:           string;
    brand_uuid:           string;
    current_oos_pos:      number;
    previous_oos_pos:     number;
    current_total_pos:    number;
    previous_total_pos:   number;
    current_oos_percent:  number;
    previous_oos_percent: number;
    delta:                number;
    trend:                'worsening' | 'improving' | 'stable';
}

/** Heatmap response */
export interface OOSHeatmapModel {
    brands:      { uuid: string; name: string }[];
    territories: { uuid: string; name: string }[];
    matrix:      number[][];
}

// ─── Share-Of-Stock (SOS) Dashboard Models ────────────────────────────────────

/** Table view row — one brand × one territory  (Sections 1) */
export interface SOSTableRowModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    brand_name:      string;
    brand_uuid:      string;
    brand_fardes:    number;
    total_fardes:    number;
    pos_count:       number;
    total_pos:       number;
    avg_sos_per_pos: number;
    sos_percent:     number;
}

/** Single brand entry inside a bar-chart territory group (Section 2) */
export interface SOSBarBrandItemModel {
    brand_name:   string;
    brand_uuid:   string;
    brand_fardes: number;
    sos_percent:  number;
}

/** Territory group for bar charts */
export interface SOSBarGroupModel {
    territory_name: string;
    territory_uuid: string;
    total_fardes:   number;
    brands:         SOSBarBrandItemModel[];
}

/** One data point on a brand trend series (Section 3) */
export interface SOSTrendPointModel {
    month:        string;
    brand_fardes: number;
    total_fardes: number;
    sos_percent:  number;
}

/** Full brand trend series */
export interface SOSTrendSeriesModel {
    brand_name: string;
    brand_uuid: string;
    data:       SOSTrendPointModel[];
}

/** Executive KPI card — Section 4 */
export interface SOSSummaryKPIModel {
    total_fardes:      number;
    total_pos_visited: number;
    dominant_brand:    string;
    dominant_sos:      number;
    weakest_brand:     string;
    weakest_sos:       number;
    brand_count:       number;
    hhi_index:         number;
    market_structure:  'competitive' | 'moderate' | 'concentrated';
}

/** Brand ranking row — Section 4 */
export interface SOSBrandRankModel {
    rank:           number;
    brand_name:     string;
    brand_uuid:     string;
    brand_fardes:   number;
    total_fardes:   number;
    sos_percent:    number;
    cumulative_sos: number;
    dominance:      'leader' | 'challenger' | 'follower';
}

/** HHI concentration row per territory — Section 4 */
export interface SOSConcentrationRowModel {
    territory_name:   string;
    territory_uuid:   string;
    hhi_index:        number;
    market_structure: 'competitive' | 'moderate' | 'concentrated';
    top_brand_name:   string;
    top_brand_sos:    number;
    brand_count:      number;
    total_fardes:     number;
}

/** Heatmap matrix response — Section 5 */
export interface SOSHeatmapModel {
    brands:      { uuid: string; name: string }[];
    territories: { uuid: string; name: string }[];
    matrix:      number[][];
}

/** Period-over-period evolution per brand — Section 5 */
export interface SOSEvolutionRowModel {
    brand_name:            string;
    brand_uuid:            string;
    current_fardes:        number;
    previous_fardes:       number;
    current_total_fardes:  number;
    previous_total_fardes: number;
    current_sos_percent:   number;
    previous_sos_percent:  number;
    delta:                 number;
    trend:                 'gaining' | 'losing' | 'stable';
}

/** Share-gap analysis row — Section 5 */
export interface SOSGapRowModel {
    brand_name:         string;
    brand_uuid:         string;
    brand_fardes:       number;
    total_fardes:       number;
    sos_percent:        number;
    equal_share_target: number;
    gap:                number;
    gap_fardes:         number;
    status:             'above_target' | 'below_target';
}

/** POS drill-down row — Section 5 */
export interface SOSPosDrillRowModel {
    pos_uuid:     string;
    pos_name:     string;
    pos_shop:     string;
    pos_type:     string;
    brand_fardes: number;
    total_fardes: number;
    visit_count:  number;
    last_visit:   string;
    min_sos:      number;
    max_sos:      number;
    avg_sos:      number;
    sos_percent:  number;
}

/** SOS × ND quadrant correlation row — Section 5 */
export interface SOSVsNDRowModel {
    brand_name:   string;
    brand_uuid:   string;
    nd_pos:       number;
    total_pos:    number;
    nd_percent:   number;
    brand_fardes: number;
    total_fardes: number;
    sos_percent:  number;
    delta_nd_sos: number;
    position:     'leader' | 'present_not_dominant' | 'stocked_not_distributed' | 'niche';
}

// ─── Weighted Distribution (WD) Dashboard Models ──────────────────────────────

/** Table view row — one brand × one territory (Sections 1) */
export interface WDTableRowModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    brand_name:      string;
    brand_uuid:      string;
    brand_volume:    number;
    total_volume:    number;
    nd_pos:          number;
    total_pos:       number;
    wd_percent:      number;
    nd_percent:      number;
}

/** Raw flat bar-chart row returned by the API (Section 2) */
export interface WDBarRawRowModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    brand_name:      string;
    brand_uuid:      string;
    brand_volume:    number;
    total_volume:    number;
    wd_percent:      number;
}

/** Brand item inside a grouped bar-chart territory (assembled client-side) */
export interface WDBarBrandItemModel {
    brand_name:   string;
    brand_uuid:   string;
    brand_volume: number;
    total_volume: number;
    wd_percent:   number;
}

/** Territory group for the bar chart (assembled client-side from flat rows) */
export interface WDBarGroupModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    total_volume:    number;
    brands:          WDBarBrandItemModel[];
}

/** Flat trend row returned by the API (Section 3) */
export interface WDTrendRowModel {
    month:        string;
    brand_name:   string;
    brand_uuid:   string;
    brand_volume: number;
    total_volume: number;
    wd_percent:   number;
}

/** Brand series (assembled client-side from flat trend rows) */
export interface WDTrendSeriesModel {
    brand_name: string;
    brand_uuid: string;
    points:     WDTrendRowModel[];
}

/** Executive KPI card (Section 4) */
export interface WDSummaryKPIModel {
    total_volume:       number;
    total_pos:          number;
    avg_wd_percent:     number;
    best_brand_name:    string;
    best_brand_wd:      number;
    worst_brand_name:   string;
    worst_brand_wd:     number;
    brands_above_50pct: number;
}

/** Brand ranking row (Section 4) */
export interface WDBrandRankModel {
    rank:         number;
    brand_name:   string;
    brand_uuid:   string;
    brand_volume: number;
    total_volume: number;
    wd_percent:   number;
    nd_pos:       number;
    total_pos:    number;
    nd_percent:   number;
    wd_nd_gap:    number;
}

/** Volume-weighted gap analysis row (Section 4) */
export interface WDGapRowModel {
    brand_name:         string;
    brand_uuid:         string;
    brand_volume:       number;
    visited_gap_volume: number;
    total_volume:       number;
    wd_percent:         number;
    opportunity_pct:    number;
}

/** Period-over-period evolution per brand (Section 5) */
export interface WDEvolutionRowModel {
    brand_name:            string;
    brand_uuid:            string;
    current_volume:        number;
    previous_volume:       number;
    current_total_volume:  number;
    previous_total_volume: number;
    current_wd_percent:    number;
    previous_wd_percent:   number;
    delta:                 number;
    trend:                 'up' | 'down' | 'stable';
}

/** Heatmap matrix response (Section 5) */
export interface WDHeatmapModel {
    brands:      { uuid: string; name: string }[];
    territories: { uuid: string; name: string }[];
    matrix:      number[][];
}

/** WD × ND quadrant correlation row (Section 5) */
export interface WDvsNDRowModel {
    brand_name:   string;
    brand_uuid:   string;
    brand_volume: number;
    total_volume: number;
    wd_percent:   number;
    nd_pos:       number;
    total_pos:    number;
    nd_percent:   number;
    quadrant:     'leader' | 'volume_focus' | 'spread' | 'laggard';
}

/** POS drill-down row (Section 5) */
export interface WDPosDrillRowModel {
    pos_name:      string;
    pos_uuid:      string;
    pos_type:      string;
    pos_volume:    number;
    total_volume:  number;
    pos_wd_percent: number;
    visit_count:   number;
}

// ─── Weighted Sales (WS) Dashboard Models ────────────────────────────────────
// WS% = SUM(sold at POS where brand counter > 0) / SUM(total sold) × 100
// Unlike WD (stock-weighted), WS weights each POS by actual units SOLD.

/** Table view row — one brand × one territory (Section 1) */
export interface WSTableRowModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    brand_name:      string;
    brand_uuid:      string;
    brand_sold:      number;
    total_sold:      number;
    nd_pos:          number;
    total_pos:       number;
    ws_percent:      number;
    nd_percent:      number;
}

/** Raw flat bar-chart row returned by the API (Section 2) */
export interface WSBarRawRowModel {
    territory_name:  string;
    territory_uuid:  string;
    brand_name:      string;
    brand_uuid:      string;
    brand_sold:      number;
    total_sold:      number;
    ws_percent:      number;
}

/** Brand item inside a grouped bar-chart territory (assembled client-side) */
export interface WSBarBrandItemModel {
    brand_name:  string;
    brand_uuid:  string;
    brand_sold:  number;
    total_sold:  number;
    ws_percent:  number;
}

/** Territory group for the bar chart (assembled client-side from flat rows) */
export interface WSBarGroupModel {
    territory_name:  string;
    territory_uuid:  string;
    total_sold:      number;
    brands:          WSBarBrandItemModel[];
}

/** Flat trend row returned by the API — Section 3 */
export interface WSTrendRowModel {
    month:       string;
    brand_name:  string;
    brand_uuid:  string;
    brand_sold:  number;
    total_sold:  number;
    ws_percent:  number;
}

/** Brand series (assembled client-side from flat trend rows) */
export interface WSTrendSeriesModel {
    brand_name: string;
    brand_uuid: string;
    points:     WSTrendRowModel[];
}

/** Executive KPI card — Section 4 */
export interface WSSummaryKPIModel {
    total_brands:       number;
    grand_total_sold:   number;
    weighted_sold:      number;
    overall_ws_percent: number;
    brands_with_ws:     number;
}

/** Brand ranking row — Section 4 */
export interface WSBrandRankModel {
    brand_name:  string;
    brand_uuid:  string;
    brand_sold:  number;
    total_sold:  number;
    nd_pos:      number;
    total_pos:   number;
    ws_percent:  number;
    nd_percent:  number;
    ws_nd_gap:   number;
    rank:        number;
}

/** Gap analysis row — 3-zone bucketing (Section 4) */
export interface WSGapRowModel {
    brand_name:  string;
    brand_uuid:  string;
    ws_percent:  number;
    zone:        'strong' | 'mid' | 'weak';
}

/** Period-over-period evolution per brand — Section 5 */
export interface WSEvolutionRowModel {
    brand_name:      string;
    brand_uuid:      string;
    curr_ws_percent: number;
    prev_ws_percent: number;
    delta_ws:        number;
}

/** Heatmap row from API (brand × territory matrix, flat) — Section 5 */
export interface WSHeatmapRawRowModel {
    territory_uuid: string;
    territory_name: string;
    brand_uuid:     string;
    brand_name:     string;
    brand_sold:     number;
    total_sold:     number;
    ws_percent:     number;
}

/** Heatmap matrix (assembled client-side) */
export interface WSHeatmapModel {
    brands:      { uuid: string; name: string }[];
    territories: { uuid: string; name: string }[];
    matrix:      number[][];
}

/** WS × ND quadrant correlation row — Section 5 */
export interface WSvsNDRowModel {
    brand_name:  string;
    brand_uuid:  string;
    brand_sold:  number;
    total_sold:  number;
    nd_pos:      number;
    total_pos:   number;
    ws_percent:  number;
    nd_percent:  number;
    segment:     'leader' | 'niche' | 'volume' | 'laggard';
}

/** POS drill-down row — Section 5 */
export interface WSPosDrillRowModel {
    pos_name:        string;
    pos_uuid:        string;
    pos_form_uuid:   string;
    brand_name:      string;
    brand_sold:      number;
    pos_total_sold:  number;
    counter:         number;
    number_farde:    number;
    ws_contribution: number;
    visit_date:      string;
}

// ─── Share In Shop (SISH) Dashboard Models ────────────────────────────────────
// SISH%  = SUM(brand_sold) / SUM(total_sold) × 100   (global market share)
// SISH_in_shop% = brand_sold / sold_at_POS_where_brand_sold > 0  (in-shop share)
// Velocity Index = SISH% / SOS%  (>1: fast mover | <1: slow mover)

/** Table view row — one brand × one territory (Section 1) */
export interface SISHTableRowModel {
    territory_name:  string;
    territory_uuid:  string;
    territory_level: string;
    brand_name:      string;
    brand_uuid:      string;
    brand_sold:      number;
    total_sold:      number;
    brand_fardes:    number;
    total_fardes:    number;
    pos_with_sales:  number;
    total_pos:       number;
    sish_percent:    number;
    sish_in_shop:    number;
    sos_percent:     number;
    velocity_index:  number;
}

/** Raw flat bar-chart row returned by the API (Section 2) */
export interface SISHBarRawRowModel {
    territory_name:  string;
    territory_uuid:  string;
    brand_name:      string;
    brand_uuid:      string;
    brand_sold:      number;
    total_sold:      number;
    sish_percent:    number;
    brand_fardes:    number;
    total_fardes:    number;
    sos_percent:     number;
    velocity_index:  number;
}

/** Territory group for the bar chart (assembled client-side) */
export interface SISHBarGroupModel {
    territory_name: string;
    territory_uuid: string;
    total_sold:     number;
    brands:         SISHBarRawRowModel[];
}

/** Flat trend row returned by the API — Section 3 */
export interface SISHTrendRowModel {
    month:          string;
    brand_name:     string;
    brand_uuid:     string;
    brand_sold:     number;
    total_sold:     number;
    brand_fardes:   number;
    total_fardes:   number;
    sish_percent:   number;
    sos_percent:    number;
    velocity_index: number;
}

/** Brand series (assembled client-side from flat trend rows) */
export interface SISHTrendSeriesModel {
    brand_name: string;
    brand_uuid: string;
    points:     SISHTrendRowModel[];
}

/** Executive KPI card — Section 4 */
export interface SISHSummaryKPIModel {
    total_sold:        number;
    total_fardes:      number;
    total_pos:         number;
    total_brands:      number;
    avg_sish_percent:  number;
    market_entropy:    number;
    top_brand_by_sish: { brand_uuid: string; brand_name: string; sish_percent: number };
    fastest_brand:     { brand_uuid: string; brand_name: string; velocity_index: number };
    slowest_brand:     { brand_uuid: string; brand_name: string; velocity_index: number };
}

/** Brand ranking row — Section 4 */
export interface SISHBrandRankModel {
    rank:            number;
    brand_uuid:      string;
    brand_name:      string;
    brand_sold:      number;
    total_sold:      number;
    brand_fardes:    number;
    total_fardes:    number;
    pos_with_sales:  number;
    total_pos:       number;
    sish_percent:    number;
    sos_percent:     number;
    sish_sos_delta:  number;
    velocity_index:  number;
    cumulative_sish: number;
    category:        'market_leader' | 'challenger' | 'niche';
}

/** Velocity index row — Section 4 */
export interface SISHVelocityRowModel {
    brand_uuid:        string;
    brand_name:        string;
    brand_sold:        number;
    brand_fardes:      number;
    total_sold:        number;
    total_fardes:      number;
    sish_percent:      number;
    sos_percent:       number;
    velocity_index:    number;
    stock_turn_days:   number;
    velocity_category: 'fast_mover' | 'aligned' | 'slow_mover';
}

/** Period-over-period evolution per brand — Section 5 */
export interface SISHEvolutionRowModel {
    brand_uuid:             string;
    brand_name:             string;
    current_sold:           number;
    previous_sold:          number;
    current_fardes:         number;
    previous_fardes:        number;
    current_total_sold:     number;
    previous_total_sold:    number;
    current_sish_percent:   number;
    previous_sish_percent:  number;
    delta:                  number;
    velocity_delta:         number;
    trend:                  'gaining' | 'losing' | 'stable';
}

/** Heatmap matrix (from API, already assembled) — Section 5 */
export interface SISHHeatmapModel {
    brands:      { uuid: string; name: string }[];
    territories: { uuid: string; name: string }[];
    matrix:      number[][];
}

/** Gap analysis row — Section 5 */
export interface SISHGapRowModel {
    brand_uuid:        string;
    brand_name:        string;
    brand_sold:        number;
    total_sold:        number;
    brand_fardes:      number;
    total_fardes:      number;
    sish_percent:      number;
    sos_percent:       number;
    equal_share_target: number;
    gap:               number;
    gap_units:         number;
    velocity_index:    number;
    status:            'above_target' | 'below_target';
}

/** SISH × SOS quadrant correlation row — Section 5 */
export interface SISHVsSosRowModel {
    brand_uuid:     string;
    brand_name:     string;
    brand_sold:     number;
    brand_fardes:   number;
    total_sold:     number;
    total_fardes:   number;
    sish_percent:   number;
    sos_percent:    number;
    delta_sish_sos: number;
    velocity_index: number;
    position:       'fast_leader' | 'sell_through_star' | 'shelf_hoarder' | 'underperformer';
}

/** POS drill-down row — Section 5 */
export interface SISHPosDrillRowModel {
    pos_uuid:          string;
    pos_name:          string;
    pos_shop:          string;
    pos_type:          string;
    brand_sold:        number;
    total_sold_at_pos: number;
    brand_fardes:      number;
    total_fardes_at_pos: number;
    visit_count:       number;
    last_visit:        string;
    avg_sish_at_pos:   number;
    avg_sos_at_pos:    number;
    sish_at_pos:       number;
    sos_at_pos:        number;
    velocity_at_pos:   number;
}