import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth/auth.service';
import { routes } from '../../shared/routes/routes';
import { AreaService } from '../areas/area.service';
import { IArea } from '../areas/models/area.model';
import { CountryService } from '../country/country.service';
import { ICountry } from '../country/models/country.model';
import { ICyclo } from '../cyclo/models/cyclo.model'; 
import { IPos } from '../pos-vente/models/pos.model';
import { IProvince } from '../province/models/province.model';
import { ProvinceService } from '../province/province.service';
import { ISubArea } from '../subarea/models/subarea.model';
import { SubareaService } from '../subarea/subarea.service';
import { LogsService } from '../user-logs/logs.service';
import { IUser } from '../user/models/user.model';
import { ICommune } from './models/commune.model';
import { CommuneService } from './commune.service';

@Component({
  selector: 'app-commune',
  standalone: false,
  templateUrl: './commune.component.html',
  styleUrl: './commune.component.scss'
})
export class CommuneComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: ICommune[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'area', 'subarea', 'name', 'pos', 'cyclo', 'posforms', 'user', 'id'];
  dataSource = new MatTableDataSource<ICommune>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: ICommune; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: ICountry[] = [];
  provinceList: IProvince[] = [];
  provinceFilterList: IProvince[] = [];
  areaList: IArea[] = [];
  areaFilterList: IArea[] = [];
  subAreaList: ISubArea[] = [];
  subAreaFilterList: ISubArea[] = [];

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService, 
    private provinceService: ProvinceService,
    private countryService: CountryService,
    private areaService: AreaService,
    private subAreaService: SubareaService,
    private communeService: CommuneService,
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

        this.communeService.refreshDataList$.subscribe(() => {
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
        this.subAreaService.getAll().subscribe(res => {
          this.subAreaList = res.data;
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
      subarea_uuid: ['', Validators.required],
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
      this.communeService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    }  else if (currentUser.role == 'ASM') {
      this.communeService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log("data", res.data);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.communeService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      this.communeService.getPaginatedBySubAreaId(currentUser.subarea_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Cyclo') {
      this.communeService.getPaginatedByUserId(currentUser.commune_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log("data", res.data);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.communeService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
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

  onAreaChange(event: any) {
    const listData = this.subAreaList.filter((v) => v.area_uuid == event.value);
    this.subAreaFilterList = listData;
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
          subarea_uuid: this.formGroup.value.subarea_uuid,
          signature: this.currentUser.fullname,
        };
        this.communeService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Commune',
              this.currentUser.uuid,
              'created',
              `Created new Commune uuid: ${res.data.uuid}`,
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
        subarea_uuid: this.formGroup.value.subarea_uuid,
        signature: this.currentUser.fullname,
      };
      this.communeService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Commune',
              this.currentUser.uuid,
              'updated',
              `Updated Commune uuid: ${res.data.uuid}`,
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
    this.communeService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        name: this.dataItem.name,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        subarea_uuid: this.dataItem.subarea_uuid,
      });
    });
  }



  delete(): void {
    this.communeService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Commune',
            this.currentUser.uuid,
            'deleted',
            `Delete Commune id: ${this.idItem}`,
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
 


