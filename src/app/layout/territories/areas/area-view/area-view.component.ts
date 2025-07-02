import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../../shared/routes/routes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IArea } from '../models/area.model';
import { AreaService } from '../area.service';
import { IProvince } from '../../province/models/province.model';
import { ProvinceService } from '../../province/province.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../../management/user-logs/logs.service';
import { CountryService } from '../../country/country.service';
import { ICountry } from '../../country/models/country.model';
import { IUser } from '../../../management/user/models/user.model';
import { IAsm } from '../../../teams/asm/models/asm.model';
import { ICyclo } from '../../../teams/cyclo/models/cyclo.model';
import { IDr } from '../../../teams/dr/models/dr.model';
import { IPos } from '../../../market/pos-vente/models/pos.model';
import { ISubArea } from '../../subarea/models/subarea.model';
import { ISup } from '../../../teams/sups/models/sup.model';
import { ICommune } from '../../commune/models/commune.model';

@Component({
  selector: 'app-area-view',
  standalone: false,
  templateUrl: './area-view.component.html',
  styleUrl: './area-view.component.scss'
})
export class AreaViewComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IArea[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'name', 'subarea', 'commune', 'pos', 'posforms', 'users', 'uuid'];
  dataSource = new MatTableDataSource<IArea>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IArea; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: ICountry[] = [];
  provinceList: IProvince[] = [];
  provinceFilterList: IProvince[] = [];

  name!: string;
  territoire_uuid!: string;
  territoire!: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private areaService: AreaService,
    private provinceService: ProvinceService,
    private countryService: CountryService,
    private logActivity: LogsService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private toastr: ToastrService
  ) {
  }

  ngAfterViewInit(): void {
    this.route.params.subscribe(params => {
      this.name = params['name'];
      this.territoire_uuid = params['uuid'];
      this.authService.user().subscribe({
        next: (user) => {
          console.log("name: ", this.name);
          console.log("territoire_uuid: ", this.territoire_uuid);

          this.currentUser = user;
          this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
          this.dataSource.sort = this.sort; // Bind sort to dataSource
          this.cdr.detectChanges();

          this.areaService.refreshDataList$.subscribe(() => {
            this.fetchProducts(this.name, this.territoire_uuid);
          });
          this.fetchProducts(this.name, this.territoire_uuid);

          this.countryService.getAll().subscribe(res => {
            this.countryList = res.data;
          });
          this.provinceService.getAll().subscribe(res => {
            this.provinceList = res.data;
          });

          this.isLoadingData = false;
        },
        error: (error) => {
          this.isLoadingData = false;
          this.router.navigate(['/auth/login']);
          console.log(error);
        }
      });
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
    this.fetchProducts(this.name, this.territoire_uuid);
  }

  fetchProducts(name: string, territoire_uuid: string) {
    if (name == "country") {
      this.countryService.get(territoire_uuid).subscribe(item => {
        this.territoire = item.data;
        this.areaService.getPaginatedByCountryUUId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
      });
    } else if (name == "province") {
      this.provinceService.get(territoire_uuid).subscribe(item => {
        this.territoire = item.data;
        this.areaService.getPaginatedByProvinceId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
      });
    }

  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts(this.name, this.territoire_uuid);
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


  getSubareaCount(subarea: ISubArea[]): string {
    return subarea ? subarea.length > 0 ? subarea.length.toString() : '0' : '0';
  }
  getCommuneCount(commune: ICommune[]): string {
    return commune ? commune.length > 0 ? commune.length.toString() : '0' : '0';
  }
  getAsmCount(asm: IAsm[]): string {
    return asm ? asm.length > 0 ? asm.length.toString() : '0' : '0';
  }
  getSupCount(sup: ISup[]): string {
    return sup ? sup.length > 0 ? sup.length.toString() : '0' : '0';
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
  getPosFormCount(posForm: IPos[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }
  getUserCount(user: IUser[]): string {
    return user ? user.length > 0 ? user.length.toString() : '0' : '0';
  }


  onCountryChange(event: any) {
    console.log(event.value);
    const provinceArray = this.provinceList.filter((v) => v.country_uuid == event.value);
    this.provinceFilterList = provinceArray;
  }


  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          name: this.formGroup.value.name,
          country_uuid: this.formGroup.value.country_uuid,
          province_uuid: this.formGroup.value.province_uuid,
          signature: this.currentUser.fullname,
        };
        this.areaService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'AREA',
              this.currentUser.uuid,
              'created',
              `Created new AREA uuid: ${res.data.uuid}`,
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
        signature: this.currentUser.fullname,
      };
      this.areaService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'AREA',
              this.currentUser.uuid,
              'updated',
              `Updated AREA uuid: ${res.data.uuid}`,
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
    this.areaService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        name: this.dataItem.name,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
      });
    });
  }



  delete(): void {
    this.areaService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'AREA',
            this.currentUser.uuid,
            'deleted',
            `Delete AREA id: ${this.idItem}`,
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

  compareFn(c1: IProvince, c2: IProvince): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }
}
