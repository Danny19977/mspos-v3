import { Component, Input, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPos } from '../../pos-vente/models/pos.model';
import { PosVenteService } from '../../pos-vente/pos-vente.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { IUser } from '../models/user.model';
import { IPosForm } from '../../posform/models/posform.model';

@Component({
  selector: 'app-pos-user-list',
  standalone: false,
  templateUrl: './pos-user-list.component.html',
  styleUrls: ['./pos-user-list.component.scss']
})
export class PosUserListComponent implements OnInit {
  @Input() userUuid!: string;
  
  isLoadingData = false;
  public routes = routes;

  // Table 
  dataList: IPos[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
  displayedColumns: string[] = [
    'status',
    'postype',
    'name',
    'shop',
    'gerant',
    'quartier',
    'avenue',
    'telephone',
  ];
  dataSource = new MatTableDataSource<IPos>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';
  currentUser!: IUser;

  constructor(
    private router: Router,
    private authService: AuthService,
    private posVenteService: PosVenteService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
  }

  ngOnInit() {
    this.isLoadingData = true;
    
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cdr.detectChanges();

        // Subscribe to refresh data when needed
        this.posVenteService.refreshDataList$.subscribe(() => {
          this.fetchUserPos();
        });
        this.fetchUserPos();
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }

  fetchUserPos() {
    this.isLoadingData = true;
    this.posVenteService.getPaginatedByCommuneId(
      this.userUuid, 
      this.current_page, 
      this.page_size, 
      this.search
    ).subscribe({
      next: (res) => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList;
        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Erreur lors de la récupération des données:', err);
        this.isLoadingData = false;
        this.toastr.error('Erreur lors du chargement des données');
      }
    });
  }

  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchUserPos();
  }

  onView(id: string) {
    this.router.navigate(['/pos-vente', id, 'view']);
  }

  onSearchChange(search: string) {
    this.search = search;
    this.current_page = 1; // Reset à la première page lors de la recherche
    this.fetchUserPos();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.search = filterValue.trim();
    this.current_page = 1; // Reset à la première page lors de la recherche
    this.fetchUserPos();
  }
}
