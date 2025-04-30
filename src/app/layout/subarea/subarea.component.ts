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
import { ICyclo } from '../cyclo/models/cyclo.model';
import { IDr } from '../dr/models/dr.model';
import { IPos } from '../pos-vente/models/pos.model';
import { IProvince } from '../province/models/province.model';
import { ProvinceService } from '../province/province.service';
import { LogsService } from '../user-logs/logs.service';
import { IUser } from '../user/models/user.model';
import { ISubArea } from './models/subarea.model';
import { IArea } from '../areas/models/area.model';
import { SubareaService } from './subarea.service';
import { AreaService } from '../areas/area.service';
import { ICommune } from '../commune/models/commune.model';

@Component({
  selector: 'app-subarea',
  standalone: false,
  templateUrl: './subarea.component.html',
  styleUrl: './subarea.component.scss'
})
export class SubareaComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: ISubArea[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'area', 'name', 'commune', 'pos', 'dr', 'cyclo', 'posforms', 'user', 'id'];
  dataSource = new MatTableDataSource<ISubArea>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: ISubArea; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: ICountry[] = [];
  provinceList: IProvince[] = [];
  provinceFilterList: IProvince[] = [];
  areaList: IArea[] = [];
  areaFilterList: IArea[] = [];

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private provinceService: ProvinceService,
    private countryService: CountryService,
    private areaService: AreaService,
    private subAreaService: SubareaService,
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
        this.cdr.detectChanges();

        this.subAreaService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser);
        });
        this.fetchProducts(this.currentUser);

        this.countryService.getAll().subscribe(res => {
          this.countryList = res.data;
        });
        this.provinceService.getAll().subscribe(res => {
          this.provinceList = res.data;
        });
        this.areaService.getAll().subscribe(res => {
          this.areaList = res.data;
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
      area_uuid: ['', Validators.required],
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
      this.subAreaService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'ASM') {
      this.subAreaService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.subAreaService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      this.subAreaService.getPaginatedBySubAreaId(currentUser.subarea_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.subAreaService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
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


  getCommuneCount(commune: ICommune[]): string {
    return commune ? commune.length > 0 ? commune.length.toString() : '0' : '0';
  }
  getDrCount(dr: IDr[]): string {
    return dr ? dr.length > 0 ? dr.length.toString() : '0' : '0';
  }
  getCycloCount(cyclo: ICyclo[]): string {
    return cyclo ? cyclo.length > 0 ? cyclo.length.toString() : '0' : '0';
  }
  getPosCount(pos: IPos[]): string {
    return pos ? pos.length > 0 ? pos.length.toString() : '0' : '0';
  }
  getUserCount(user: IUser[]): string {
    return user ? user.length > 0 ? user.length.toString() : '0' : '0';
  }


  onCountryChange(event: any) {
    const listData = this.provinceList.filter((v) => v.country_uuid == event.value);
    this.provinceFilterList = listData;
  }

  onProvinceChange(event: any) {
    const listData = this.areaList.filter((v) => v.province_uuid == event.value);
    this.areaFilterList = listData;
  }


  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          name: this.formGroup.value.name,
          country_uuid: this.formGroup.value.country_uuid,
          province_uuid: this.formGroup.value.province_uuid,
          area_uuid: this.formGroup.value.area_uuid,
          signature: this.currentUser.fullname,
        };
        this.subAreaService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'SubAREA',
              this.currentUser.uuid,
              'created',
              `Created new SubAREA uuid: ${res.data.uuid}`,
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
      var body = {
        name: this.formGroup.value.name,
        country_uuid: this.formGroup.value.country_uuid,
        province_uuid: this.formGroup.value.province_uuid,
        area_uuid: this.formGroup.value.area_uuid,
        signature: this.currentUser.fullname,
      };
      this.subAreaService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'SubAREA',
              this.currentUser.uuid,
              'updated',
              `Updated SubAREA uuid: ${res.data.uuid}`,
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
    this.subAreaService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        name: this.dataItem.name,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
      });
    });
  }



  delete(): void {
    this.subAreaService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'SubAREA',
            this.currentUser.uuid,
            'deleted',
            `Delete SubAREA id: ${this.idItem}`,
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


}


