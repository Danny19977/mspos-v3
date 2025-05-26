import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth/auth.service';
import { routes } from '../../shared/routes/routes'; 
import { CountryService } from '../country/country.service';
import { ICountry } from '../country/models/country.model'; 
import { LogsService } from '../user-logs/logs.service';
import { IUser } from '../user/models/user.model';
import { IProvince } from '../province/models/province.model';
import { ProvinceService } from '../province/province.service';
import { IBrand } from './models/brand.model';
import { BrandService } from './brand.service';
import { IPosFormItem } from '../posform/models/posform_item.model';
import { db } from '../../shared/services/db';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-brand',
  standalone: false,
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss'
})
export class BrandComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;

  // Table 
  dataList: IBrand[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'name', 'posformitem', 'uuid'];
  dataSource = new MatTableDataSource<IBrand>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IBrand; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: ICountry[] = [];
  provinceList: IProvince[] = [];
  provinceFilterList: IProvince[] = [];

  dataListLocal: IBrand[] = [];
  isOnLine: boolean = navigator.onLine;

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private brandService: BrandService,
    private provinceService: ProvinceService,
    private countryService: CountryService,
    private logActivity: LogsService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private toastr: ToastrService
  ) {
  }


  ngAfterViewInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        this.cdr.detectChanges(); // Trigger change detection

        this.brandService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser);
        });
        this.fetchProducts(this.currentUser);

        this.countryService.getAll().subscribe(res => {
          this.countryList = res.data;
        });
        this.provinceService.getAll().subscribe(res => {
          this.provinceList = res.data;
        });
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
    this.formGroup = this._formBuilder.group({
      name: ['', Validators.required],
      country_uuid: ['', Validators.required],
      province_uuid: ['', Validators.required],
    });
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts(this.currentUser);
  }

  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.brandService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'ASM') {
      this.brandService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.brandService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    }
  }


  fecthlocalData() {
    liveQuery(() => db.brands.toArray()).subscribe(data => {
      this.dataListLocal = data;
      // this.total_pages = Math.ceil(data.length / this.page_size);
      // this.total_records = data.length;
      // this.dataSource.data = this.dataListLocal; // Update dataSource data
      this.isLoadingData = false;
    });
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


  getPostFormItemCount(postFormItem: IPosFormItem[]): string {
    return postFormItem ? postFormItem.length > 0 ? postFormItem.length.toString() : '0' : '0';
  }

  onCountryChange(event: any) {
    const provinceArray = this.provinceList.filter((v) => v.country_uuid == event.value);
    this.provinceFilterList = provinceArray;
  }


  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body: IBrand = {
          name: this.formGroup.value.name,
          country_uuid: this.formGroup.value.country_uuid,
          province_uuid: this.formGroup.value.province_uuid,
          signature: this.currentUser.fullname,
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
        };
        this.brandService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Brand',
              this.currentUser.uuid,
              'created',
              `Created new Brand uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.formGroup.reset();
                this.toastr.success('Ajouter avec succès!', 'Success!');
              },
              error: (err) => {
                this.isLoading = false;
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: (err) => {
            this.isLoading = false;
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  onSubmitUpdate() {
    try {
      this.isLoading = true;
      var body: IBrand = {
        name: this.formGroup.value.name,
        country_uuid: this.formGroup.value.country_uuid,
        province_uuid: this.formGroup.value.province_uuid,
        signature: this.currentUser.fullname,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      };
      this.brandService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Brand',
              this.currentUser.uuid,
              'updated',
              `Updated Brand uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.formGroup.reset();
                this.toastr.success('Modification enregistré!', 'Success!');
                this.isLoading = false;
              },
              error: (err) => {
                this.isLoading = false;
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: err => {
            console.log(err);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            this.isLoading = false;
          }
        });
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  findValue(value: string) {
    this.idItem = value;
    this.brandService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        name: this.dataItem.name,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
      });
    });
  }


  delete(): void {
    this.brandService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Brand',
            this.currentUser.uuid,
            'deleted',
            `Delete Brand id: ${this.idItem}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
              this.formGroup.reset();
              this.toastr.info('Supprimé avec succès!', 'Success!');
              this.isLoading = false;
            },
            error: (err) => {
              this.isLoading = false;
              this.toastr.error(`${err.error.message}`, 'Oupss!');
              console.log(err);
            }
          });
        },
        error: err => {
          this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
          console.log(err);
        }
      }
      );
  }

  compareFn(c1: ICountry, c2: ICountry): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnProvince(c1: IProvince, c2: IProvince): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }
}

