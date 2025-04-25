

export interface SOSPieModel {
	Province: string;
	Eq: number;
}

export interface PerfVisitModel {
	Province: string
	Nd: number;
	Sos: number;
	Oos: number;
	Dr: number;
	Visit: number;
	Obj: number;
	Perf: number;
}

export interface SumChartBarModel {
	Province: string
	Nd: number;
	Sos: number;
	Oos: number; 
} 


export interface BetterModel {
	Fullname: string;
	Province: string;
	Area: string;
	Ventes: number;
}

export interface StatusEquipementModel {
	Equipement: string;
	Count: number; 
}


export interface GoogleMapModel {
	Latitude: string;
	Longitude: string; 
	Name: string;
}   
export interface PriceSaleModel {
	Price: string;
	Count: number;
}