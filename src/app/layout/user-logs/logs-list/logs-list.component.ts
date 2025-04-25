import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { routes } from '../../../shared/routes/routes';
import { UserLogsModel } from '../models/user-logs.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { LogsService } from '../logs.service';
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';
import { IUser } from '../../user/models/user.model';

@Component({
  selector: 'app-logs-list',
  standalone: false,
  templateUrl: './logs-list.component.html',
  styleUrl: './logs-list.component.scss'
})
export class LogsListComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;

  currentUser!: IUser;

  public search = '';

  // Table 
  dataList: UserLogsModel[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;
 
  displayedColumns: string[] = ['created', 'fullname', 'title', 'name', 'action', 'description'];
  dataSource = new MatTableDataSource<UserLogsModel>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor( 
    private router: Router, 
    private authService: AuthService,
    private logsService: LogsService, 
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) { 
  }


  ngAfterViewInit(): void { 
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        this.cdr.detectChanges(); // Trigger change detection
        this.logsService.refreshDataList$.subscribe(() => {
          this.fetchProducts();
        });
        this.fetchProducts(); 
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }

  ngOnInit() {
    this.isLoadingData = true; 
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts();
  }

  fetchProducts() {
    this.logsService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
      this.dataList = res.data; 
      this.total_pages = res.pagination.total_pages;
      this.total_records = res.pagination.total_records;
      this.dataSource.data = this.dataList; // Update dataSource data

      this.isLoadingData = false;
    });
  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts();
  }


  public sortData(sort: Sort) {
    const data = this.dataList.slice();
    if (!sort.active || sort.direction === '') {
      this.dataList = data;
    } else {
      this.dataList = data.sort((a, b) => {
        const aValue = (a as never)[sort.active];
        const bValue = (b as never)[sort.active];
        return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  public sidebarPopup = false;
  public sidebarPopup2 = false;
  openSidebarPopup() {
    this.sidebarPopup = !this.sidebarPopup;
  }
  openSidebarPopup2() {
    this.sidebarPopup2 = !this.sidebarPopup2;
  }  

}
