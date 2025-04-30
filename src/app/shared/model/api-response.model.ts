export interface ApiResponse {
    data: any[];
    pagination: {
        page: number;
        page_size: number;
        total_pages: number;
        length: number;
    }
} 


export interface ApiResponse2 {
    data: any[];
    pagination: {
        current_page: number;
        page_size: number;
        total_pages: number;
        total_records: number;
    }
}  

export interface ApiResponseNdDashboard {
    data: {
        name: string;
        brand_name: string;
        total_count: number;
        pourcentage: number;
    }; 
}  

export interface ApiResponseNdDashboardTotalByMonth {
    data: { 
        brand_name: string;
        month: string;
        total_count: number;
        pourcentage: number;
    }; 
}  