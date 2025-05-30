import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core'; 
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router'; 
import { AuthService } from '../../auth/auth.service';
import { routes } from '../../shared/routes/routes'; 
import { IPos } from '../pos-vente/models/pos.model';
import { IPosForm } from '../posform/models/posform.model'; 
import { IUser } from '../user/models/user.model';
import { UserService } from '../user/user.service'; 
import { CycloService } from './cyclo.service';

@Component({
  selector: 'app-cyclo',
  standalone: false,
  templateUrl: './cyclo.component.html',
  styleUrl: './cyclo.component.scss'
})
export class CycloComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IUser[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'area', 'subarea', 'commune', 'asm', 'sup', 'dr', 'user', 'pos', 'postforms'];
  dataSource = new MatTableDataSource<IUser>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';
 
 
  currentUser!: IUser;
  
  constructor(
    private router: Router, 
    private authService: AuthService, 
    private cycloService: CycloService, 
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef 
  ) {
  }


  ngAfterViewInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        this.cdr.detectChanges(); // Trigger change detection

        this.cycloService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser);
        });
        this.fetchProducts(this.currentUser);
 
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


 
  getPosCount(pos: IPos[]): string {
    return pos ? pos.length > 0 ? pos.length.toString() : '0' : '0';
  }
  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }
  getUserCount(user: IUser[]): string {
    return user ? user.length > 0 ? user.length.toString() : '0' : '0';
  }

 


  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.cycloService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'ASM') {
      this.cycloService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.cycloService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      this.cycloService.getPaginatedBySubAreaId(currentUser.subarea_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Cyclo') {
      this.cycloService.getPaginatedByCommuneId(currentUser.uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.cycloService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log('dataList:', this.dataList);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data

        this.isLoadingData = false;
      });
    }
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts(this.currentUser);
  }


  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts(this.currentUser);
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
 
 
}


