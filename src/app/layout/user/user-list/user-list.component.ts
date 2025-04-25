import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { routes } from '../../../shared/routes/routes';
import { UserService } from '../user.service';
import { IUser } from '../models/user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPermission, permissions } from '../../../shared/model/permission.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { IArea } from '../../areas/models/area.model';
import { ICountry } from '../../country/models/country.model';
import { IProvince } from '../../province/models/province.model';
import { AreaService } from '../../areas/area.service';
import { CountryService } from '../../country/country.service';
import { ProvinceService } from '../../province/province.service';
import { ICommune } from '../../commune/models/commune.model';
import { ISubArea } from '../../subarea/models/subarea.model';
import { SubareaService } from '../../subarea/subarea.service';
import { CommuneService } from '../../commune/commune.service';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit, AfterViewInit {
  isLoadingData = false;
  public routes = routes;

  // Table 
  dataList: IUser[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['status', 'fullname', 'title', 'email', 'phone', 'country', 'province', 'area', 'subarea', 'commune', 'uuid'];
  dataSource = new MatTableDataSource<IUser>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IUser; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  public password: boolean[] = [false];
  isStatusList: boolean[] = [false, true];
  isTitleList: string[] = [
    'Manager',
    'ASM',
    'Supervisor',
    'DR',
    'Cyclo',
    'MarketInfo',
    'Support'
  ];

  permissionList: IPermission[] = permissions;

  isManager = false;

  countryList: ICountry[] = [];

  provinceList: IProvince[] = [];
  provinceListFilter: IProvince[] = [];

  areaList: IArea[] = [];
  areaListFilter: IArea[] = [];

  subAreaList: ISubArea[] = [];
  subAreaListFilter: ISubArea[] = [];

  communeList: ICommune[] = [];
  communeListFilter: ICommune[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private usersService: UserService,
    private _formBuilder: FormBuilder,
    private logActivity: LogsService,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private areaService: AreaService,
    private subAreaService: SubareaService,
    private communeService: CommuneService,

    private toastr: ToastrService
  ) { }

  ngAfterViewInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        this.usersService.refreshDataList$.subscribe(() => {
          this.fetchProducts();
        });
        this.fetchProducts();

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
        this.communeService.getAll().subscribe(res => {
          this.communeList = res.data;
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
      fullname: ['', Validators.required],
      email: ['', Validators.required],
      title: ['', Validators.required],
      phone: ['', Validators.required],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],
      permission: ['', Validators.required],
      status: [''],
      country_uuid: [''],
      province_uuid: [''],
      area_uuid: ['',],
      subarea_uuid: [''],
      commune_uuid: [''],
    });


  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts();
  }

  fetchProducts() {
    this.usersService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
      this.dataList = res.data;
      this.total_pages = res.pagination.total_pages;
      this.total_records = res.pagination.total_records;
      this.dataSource.data = this.dataList; // Update dataSource data
      this.dataSource.sort = this.sort;

      this.isLoadingData = false;
    });

  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts();
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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


  public togglePassword(index: number) {
    this.password[index] = !this.password[index]
  }


  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          fullname: this.formGroup.value.fullname,
          email: this.formGroup.value.email,
          title: this.formGroup.value.title,
          phone: this.formGroup.value.phone,
          password: this.formGroup.value.password,
          password_confirm: this.formGroup.value.password_confirm,

          country_uuid: this.formGroup.value.country_uuid,
          province_uuid: this.formGroup.value.province_uuid,
          area_uuid: this.formGroup.value.area_uuid,
          subarea_uuid: this.formGroup.value.subarea_uuid,
          commune_uuid: this.formGroup.value.commune_uuid,

          // pos_id: (this.isManager) ? 0 : parseInt(this.formGroup.value.pos_id),
          role: this.formGroup.value.title, // Role et title c'est la meme chose mais le role cest pour le code source
          permission: this.formGroup.value.permission,
          // image: this.imageUrl,  
          status: (this.formGroup.value.status) ? this.formGroup.value.status : false,
          // is_manager: (this.formGroup.value.is_manager) ? this.formGroup.value.is_manager : false,
          signature: this.currentUser.fullname,
        };
        this.usersService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'created',
              `Created new user uuid: ${res.data.uuid}`,
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
            this.toastr.error(`${err.error.message}`, 'Oupss!');
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
        fullname: this.formGroup.value.fullname,
        email: this.formGroup.value.email,
        title: this.formGroup.value.title,
        phone: this.formGroup.value.phone,
        password: this.formGroup.value.password,
        password_confirm: this.formGroup.value.password_confirm,

        country_uuid: this.formGroup.value.country_uuid,
        province_uuid: this.formGroup.value.province_uuid,
        area_uuid: this.formGroup.value.area_uuid,
        subarea_uuid: this.formGroup.value.subarea_uuid,
        commune_uuid: this.formGroup.value.commune_uuid,

        // pos_id: (this.isManager) ? 0 : parseInt(this.formGroup.value.pos_id),
        role: this.formGroup.value.title, // Role et title c'est la meme chose mais le role cest pour le code source
        permission: this.formGroup.value.permission,
        // image: this.imageUrl,  
        status: (this.formGroup.value.status) ? this.formGroup.value.status : false,
        signature: this.currentUser.fullname,
      };
      this.usersService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'updated',
              `Updated user uuid: ${res.data.uuid}`,
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

  findValue(value: any) {
    this.idItem = value;
    this.usersService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        fullname: this.dataItem.fullname,
        email: this.dataItem.email,
        title: this.dataItem.title,
        phone: this.dataItem.phone,
        password: this.dataItem.password,
        // pos_id: this.dataItem.pos_id,
        role: this.dataItem.title, // Role et title c'est la meme chose mais le role cest pour le code source
        permission: this.dataItem.permission,
        // image: this.imageUrl,
        status: this.dataItem.status,
        // is_manager: this.dataItem.is_manager,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        subarea_uuid: this.dataItem.subarea_uuid,
        commune_uuid: this.dataItem.commune_uuid,
      });
    }
    );
  }



  delete(): void {
    this.usersService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Users',
            this.currentUser.uuid,
            'deleted',
            `Delete user id: ${this.idItem}`,
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



  onCountryChange(event: any) {
    const provinceArray = this.provinceList.filter((v) => v.country_uuid == event.value);
    this.provinceListFilter = provinceArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    );
  }

  onProvinceChange(event: any) {
    const areaArray = this.areaList.filter((v) => v.province_uuid == event.value);
    this.areaListFilter = areaArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    ); 
  }

  onAreaChange(event: any) {
    const subAreaArray = this.subAreaList.filter((v) => v.area_uuid == event.value);
    this.subAreaListFilter = subAreaArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    );
  }

  onSubAreaChange(event: any) {
    const communeArray = this.communeList.filter((v) => v.subarea_uuid == event.value);
    this.communeListFilter = communeArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    );
  }


  compareFn(c1: ICountry, c2: ICountry): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnProvince(c1: IProvince, c2: IProvince): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnArea(c1: IArea, c2: IArea): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnSubArea(c1: ISubArea, c2: ISubArea): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnCommune(c1: ICommune, c2: ICommune): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }
}
