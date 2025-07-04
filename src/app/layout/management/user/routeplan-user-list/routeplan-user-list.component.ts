import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort'; 
import { IRoutePlan } from '../../../market/routeplan/models/routeplan.model';
import { RouteplanService } from '../../../market/routeplan/routeplan.service';

@Component({
  selector: 'app-routeplan-user-list',
  standalone: false,
  templateUrl: './routeplan-user-list.component.html',
  styleUrl: './routeplan-user-list.component.scss'
})
export class RouteplanUserListComponent implements OnInit, OnChanges {
  @Input() userUuid!: string;

  // Table configuration
  isLoadingData = false;
  dataList: IRoutePlan[] = [];
  total_pages: number = 0;
  page_size: number = 10;
  current_page: number = 1;
  total_records: number = 0;
  public search = '';

  // Table columns
  displayedColumns: string[] = ['created', 'country', 'province', 'area', 'subarea', 'commune', 'total_pos', 'status'];
  dataSource = new MatTableDataSource<IRoutePlan>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private routeplanService: RouteplanService
  ) {}

  ngOnInit() {
    if (this.userUuid) {
      this.fetchUserRoutePlans();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userUuid'] && !changes['userUuid'].firstChange) {
      this.fetchUserRoutePlans();
    }
  }

  fetchUserRoutePlans() {
    if (!this.userUuid) return;
    
    this.isLoadingData = true;
    this.routeplanService.getPaginatedByUserId(
      this.userUuid, 
      this.current_page, 
      this.page_size, 
      this.search
    ).subscribe({
      next: (res) => {
        this.dataList = res.data || [];
        this.total_pages = res.pagination?.total_pages || 0;
        this.total_records = res.pagination?.total_records || 0;
        this.dataSource.data = this.dataList;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des plans de route:', error);
        this.isLoadingData = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.fetchUserRoutePlans();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.search = filterValue.trim().toLowerCase();
    this.current_page = 1; // Reset to first page when searching
    this.fetchUserRoutePlans();
  }

  getTotalPosCount(routePlan: IRoutePlan): number {
    const total_route_plan_item_active = routePlan.RoutePlanItems?.filter(item => item.status).length || 0;
    return total_route_plan_item_active || 0;
  }

  getStatusText(routePlan: IRoutePlan): string {
    const totalActive = routePlan.RoutePlanItems || 0;
    const totalItems = routePlan.RoutePlanItems || 0;
    
    if (totalItems === 0) return 'Aucun POS';
    if (totalActive === totalItems) return 'Terminé';
    // if (totalActive > 0) return 'En cours';
    return 'Non commencé';
  }

  getStatusClass(routePlan: IRoutePlan): string {
    const totalActive = routePlan.RoutePlanItems || 0;
    const totalItems = routePlan.RoutePlanItems || 0;
    
    if (totalItems === 0) return 'status-empty';
    if (totalActive === totalItems) return 'status-completed';
    // if (totalActive > 0) return 'status-in-progress';
    return 'status-not-started';
  }
}
