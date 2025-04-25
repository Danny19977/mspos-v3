
export interface TableViewModel {
    Area: string,
    Eq: number,
    // Sold   : number,
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
    Month: string;
    Eq: number;  
}

