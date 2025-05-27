import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { IAsm } from '../models/asm.model';
import { IProvince } from '../../province/models/province.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ICountry } from '../../country/models/country.model';
import { IUser } from '../../user/models/user.model';
import { IPos } from '../../pos-vente/models/pos.model';
import { IPosForm } from '../../posform/models/posform.model';
import { UserService } from '../../user/user.service';

@Component({
  selector: 'app-asm-list',
  standalone: false,
  templateUrl: './asm-list.component.html',
  styleUrl: './asm-list.component.scss'
})
export class AsmListComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IAsm[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'user', 'sups', 'drs', 'cyclos', 'pos', 'postforms'];
  dataSource = new MatTableDataSource<IAsm>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  uuidItem!: string;
  dataItem!: IAsm; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: ICountry[] = [];
  provinceList: IProvince[] = [];
  provinceFilterList: IProvince[] = [];

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    public usersService: UserService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngAfterViewInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        this.cdr.detectChanges(); // Trigger change detection

        this.usersService.refreshDataList$.subscribe(() => {
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

  onCountryChange(event: any) {
    const country_uuid = event.value;
    const provinceArray = this.provinceList.filter((v) => v.country_uuid == country_uuid);
    this.provinceFilterList = provinceArray;
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts(this.currentUser);
  }

  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.usersService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data

        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'ASM') {
      this.usersService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.usersService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log('dataList', res.data);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data

        this.isLoadingData = false;
      });
    }

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
