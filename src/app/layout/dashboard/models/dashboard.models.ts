
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
    latitude: number;
    longitude: number;
    signature: string;
    pos_uuid: string;
    pos_name: string;
    postype: string;
    asm: string;
    sup: string;
    dr: string;
    cyclo: string;
    created_at: string;
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