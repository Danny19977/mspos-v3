import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, Subject, tap, map } from 'rxjs';
import { ApiResponse, ApiResponse2 } from '../model/api-response.model';
import { OfflineService } from './offline.service';

@Injectable({
  providedIn: 'root'
})
export abstract class ApiService {
  abstract get endpoint(): string;
  
  protected offlineService!: OfflineService;

  constructor(
    protected http: HttpClient,
    protected injector: Injector
  ) {
    // Lazy inject OfflineService to avoid circular dependency
    setTimeout(() => {
      this.offlineService = this.injector.get(OfflineService);
    });
  }

  private _refreshDataList$ = new Subject<void>();

  private _refreshData$ = new Subject<void>();

  get refreshDataList$() {
    return this._refreshDataList$;
  }

  get refreshData$() {
    return this._refreshData$;
  }

  getPaginatedRangeDate2(page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string
  ): Observable<ApiResponse2> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<ApiResponse2>(`${this.endpoint}/all/paginate`, { params });
  }

  getPaginatedRangeDateByUUID(uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string
  ): Observable<ApiResponse2> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<ApiResponse2>(`${this.endpoint}/all/paginate/${uuid}`, { params });
  }

  getPaginated2(page: number, pageSize: number, search: string): Observable<ApiResponse2> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
      .set("search", search)
    const url = `${this.endpoint}/all/paginate?${params.toString()}`;
    
    if (this.offlineService) {
      return this.offlineService.request<ApiResponse2>('GET', url, undefined, { cacheResponse: true });
    }
    return this.http.get<ApiResponse2>(`${this.endpoint}/all/paginate`, { params });
  }

  getPaginated2NoSearch(page: number, pageSize: number): Observable<ApiResponse2> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", pageSize.toString())
    return this.http.get<ApiResponse2>(`${this.endpoint}/all/paginate/nosearch`, { params });
  }

  // @Cacheable({ cacheBusterObserver: cacheBuster$ })
  getPaginatedById(uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/${uuid}`, { params });
  }

  getPaginatedByCountryUUId(country_uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/country/${country_uuid}`, { params });
  }

  getPaginatedByProvinceId(province_uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    const url = `${this.endpoint}/all/paginate/province/${province_uuid}?${params.toString()}`;
    
    if (this.offlineService) {
      return this.offlineService.request<any>('GET', url, undefined, { cacheResponse: true, filterByProvince: true });
    }
    return this.http.get<any>(`${this.endpoint}/all/paginate/province/${province_uuid}`, { params });
  }

  getPaginatedRangeDateByProvinceId(province_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/province/${province_uuid}`, { params });
  }

  getPaginatedByAreaId(area_uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/area/${area_uuid}`, { params });
  }

  getPaginatedRangeDateByAreaId(area_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/area/${area_uuid}`, { params });
  }

  getPaginatedBySubAreaId(sub_area_uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/subarea/${sub_area_uuid}`, { params });
  }

  getPaginatedRangeDateBySubAreaId(sub_area_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/subarea/${sub_area_uuid}`, { params });
  }

  getPaginatedByCommuneId(user_uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/commune/${user_uuid}`, { params });
  }

  getPaginatedRangeDateByCommuneId(user_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/commune/${user_uuid}`, { params });
  }

  getPaginatedByUserId(user_uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/${user_uuid}`, { params });
  }

  getPaginatedRangeDateByUserId(user_uuid: string, page: number, pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
      .set("start_date", startDateStr)
      .set("end_date", endDateStr)
    return this.http.get<any>(`${this.endpoint}/all/paginate/${user_uuid}`, { params });
  }

  GetAllBySearch(search: string): Observable<any> {
    let params = new HttpParams()
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/search/${search}`, { params });
  }

  getData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.endpoint}/all`);
  }

  // @Cacheable({ cacheBusterObserver: cacheBuster$ })
  getAll(): Observable<any> {
    if (this.offlineService) {
      return this.offlineService.request<any>('GET', `${this.endpoint}/all`, undefined, { cacheResponse: true });
    }
    return this.http.get(`${this.endpoint}/all`);
  }

  getAllById(uuid: string): Observable<any> {
    if (this.offlineService) {
      return this.offlineService.request<any>('GET', `${this.endpoint}/all/${uuid}`, undefined, { cacheResponse: true });
    }
    return this.http.get(`${this.endpoint}/all/${uuid}`);
  }

  getAllByManager(country_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/countries/${country_uuid}`);
  }

  getAllByASM(province_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/provinces/${province_uuid}`);
  }

  getAllBySup(area_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/areas/${area_uuid}`);
  }

  getAllByDR(sub_area_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/subareas/${sub_area_uuid}`);
  }

  getAllByCyclo(cyclo_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/cyclo/${cyclo_uuid}`);
  }


  // @Cacheable({ cacheBusterObserver: cacheBuster$ })
  all(page?: number): Observable<any> {
    let url = `${this.endpoint}`;
    if (page) { // page is optional
      url += `?page=${page}`;
    }
    return this.http.get(url);
  }

  get(uuid: any): Observable<any> {
    return this.http.get(`${this.endpoint}/get/${uuid}`);
  }

  getBy(uuid: any): Observable<any> {
    return this.http.get(`${this.endpoint}/get-by/${uuid}`);
  }

  getByUserUUID(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/get-by-user/${uuid}`);
  }


  create(data: any): Observable<any> {
    if (this.offlineService) {
      return this.offlineService.request('POST', `${this.endpoint}/create`, data).pipe(
        tap(() => {
          this._refreshDataList$.next();
          this._refreshData$.next();
        })
      );
    }
    return this.http.post(`${this.endpoint}/create`, data).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
    }));
  }

  update(uuid: string, data: any): Observable<any> {
    if (this.offlineService) {
      return this.offlineService.request('PUT', `${this.endpoint}/update/${uuid}`, data).pipe(
        tap(() => {
          this._refreshDataList$.next();
          this._refreshData$.next();
        })
      );
    }
    return this.http.put(`${this.endpoint}/update/${uuid}`, data).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
    }));
  }


  delete(uuid: string): Observable<void> {
    if (this.offlineService) {
      return this.offlineService.request('DELETE', `${this.endpoint}/delete/${uuid}`, { uuid }).pipe(
        map(() => undefined),
        tap(() => {
          this._refreshDataList$.next();
          this._refreshData$.next();
        })
      );
    }
    return this.http.delete<void>(`${this.endpoint}/delete/${uuid}`).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
    }));
  }

  // Get file
  getFile(url: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${url}`);
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.endpoint}/uploads`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}