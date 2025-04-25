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