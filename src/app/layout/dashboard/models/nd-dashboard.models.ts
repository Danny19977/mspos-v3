
export interface TableViewModel {
    name: string;
    brand_name: string;
    total_count: number;
    percentage: number;
    total_pos: number;
}

export interface NDAverageModel {
    x: string;
    y: number;
}
 

export interface NDByAreaModel {
    Eq: number, 
    Dhl: number,
    Ar: number,
    Sbl: number,
    Pmf: number,
    Pmm: number,
    Ticket: number,
    Mtc: number,
    Ws: number,
    Mast: number,
    Oris: number,
    Elite: number, 
    Yes: number,
    Time: number,
}

export interface NDPerformanceModel {
    area: string;
    data: number;  
}

export interface NDYearModel {
    month: string;
    brand_name: string;
    total_count: number;
    percentage: number;
    total_pos: number;
}

