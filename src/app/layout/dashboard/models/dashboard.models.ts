
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