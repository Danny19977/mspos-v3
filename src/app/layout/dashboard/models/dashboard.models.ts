
export interface TableViewModel {
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


export interface SOSTableViewModel {
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
}


export interface SETableViewModel {
    name: string;
    type_pos: string;
    total_pos: number;
}

export interface SETableViewPriceModel {
    name: string;
    price: string;
    count_price: number;
    sold: number;
}

export interface KPITableViewPriceModel {
    name: string;
    signature: string;
    title: string;
    total_visits: number;
    objectif: number;
    target: number;
}