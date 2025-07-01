import { Component, Input, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPosForm } from '../../posform/models/posform.model';
import { PosformService } from '../../posform/posform.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { IUser } from '../models/user.model';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-posform-user-list',
  standalone: false,
  templateUrl: './posform-user-list.component.html',
  styleUrls: ['./posform-user-list.component.scss']
})
export class PosformUserListComponent implements OnInit {
  @Input() userUuid!: string;

  isLoadingData = false;
  public routes = routes;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;
  rangeDate: any[] = [];

  // Table 
  dataList: IPosForm[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
  displayedColumns: string[] = [
    'createdat',
    'pos',
    'price',
    'asm',
    'sup',
    'dr',
    'brand',
    'comment',
    'action'
  ];
  dataSource = new MatTableDataSource<IPosForm>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';
  currentUser!: IUser;

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posformService: PosformService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
  }

  ngOnInit() {
    this.isLoadingData = true;

    // Initialize date range (current month)
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      rangeValue: new FormControl(this.rangeDate),
    });

    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cdr.detectChanges();

        this.fetchUserPosForms();
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }

  fetchUserPosForms() {
    this.isLoadingData = true;
    this.posformService.getPaginatedRangeDateByUUID(
      this.userUuid,
      this.current_page,
      this.page_size,
      this.start_date,
      this.end_date,
      this.search
    ).subscribe({
      next: (res: any) => {
        // Additional client-side filtering by user if needed
        this.dataList = res.data;

        this.total_records = this.dataList.length;
        this.total_pages = Math.ceil(this.total_records / this.page_size);

        this.dataSource.data = this.dataList;
        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingData = false;
        console.error('Error fetching user posforms:', error);
        this.toastr.error('Erreur lors du chargement des rapports');
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.fetchUserPosForms();
  }

  onView(id: string) {
    this.router.navigate(['/posform', id, 'view']);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onDateRangeChange() {
    if (this.dateRange.value.rangeValue && this.dateRange.value.rangeValue.length === 2) {
      this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
      this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');
      this.fetchUserPosForms();
    }
  }

  onStartDateChange(event: any) {
    this.start_date = event.target.value;
    this.fetchUserPosForms();
  }

  onEndDateChange(event: any) {
    this.end_date = event.target.value;
    this.fetchUserPosForms();
  }

  getBrandCount(brands: any[]): number {
    return brands ? brands.length : 0;
  }

  getTotalPrice(posform: IPosForm): number {
    return posform.price || 0;
  }
}
