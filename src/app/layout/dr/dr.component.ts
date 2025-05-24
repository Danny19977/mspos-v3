import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth/auth.service';
import { routes } from '../../shared/routes/routes';
import { IArea } from '../areas/models/area.model';
import { IAsm } from '../asm/models/asm.model';
import { ICountry } from '../country/models/country.model';
import { ICyclo } from '../cyclo/models/cyclo.model';
import { IPos } from '../pos-vente/models/pos.model';
import { IPosForm } from '../posform/models/posform.model';
import { IProvince } from '../province/models/province.model';
import { ISup } from '../sups/models/sup.model';
import { LogsService } from '../user-logs/logs.service';
import { IUser } from '../user/models/user.model';
import { UserService } from '../user/user.service';
import { IDr } from './models/dr.model';
import { DrService } from './dr.service';
import { ISubArea } from '../subarea/models/subarea.model';
import { SubareaService } from '../subarea/subarea.service';

@Component({
  selector: 'app-dr',
  standalone: false,
  templateUrl: './dr.component.html',
  styleUrl: './dr.component.scss'
})
export class DrComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IDr[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'area', 'subarea', 'asm', 'sup', 'user', 'cyclos', 'pos', 'postforms', 'uuid'];
  dataSource = new MatTableDataSource<IDr>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  uuidItem!: string;
  dataItem!: IDr; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: ICountry[] = [];
  provinceList: IProvince[] = [];
  provinceFilterList: IProvince[] = [];

  areaList: IArea[] = [];
  areaFilterList: IArea[] = [];

  subareaList: ISubArea[] = [];
  subareaFilterList: ISubArea[] = [];

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private subareaService: SubareaService, 
    private drService: DrService,
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

        this.drService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser);
        });
        this.fetchProducts(this.currentUser); 
        
        this.subareaService.getAllById(this.currentUser.area_uuid).subscribe(res => {
          this.subareaList = res.data;
          console.log('subareaList:', this.subareaList);
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
      // country_uuid: ['', Validators.required],
      // province_uuid: ['', Validators.required],
      // area_uuid: ['', Validators.required],
      subarea_uuid: ['', Validators.required],
      // asm_uuid: ['', Validators.required],
      // sup_uuid: ['', Validators.required],
      // user_uuid: ['', Validators.required],
    });
  }


  getCycloCount(cyclo: ICyclo[]): string {
    return cyclo ? cyclo.length > 0 ? cyclo.length.toString() : '0' : '0';
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
      this.drService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'ASM') {
      this.drService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.drService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log('dataList DR:', this.dataList);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      this.drService.getPaginatedBySubAreaId(currentUser.subarea_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.drService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log('dataList DR:', this.dataList);
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


  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body: IDr = {
          country_uuid: this.currentUser.country_uuid,
          province_uuid: this.currentUser.province_uuid,
          area_uuid: this.currentUser.area_uuid,
          subarea_uuid: this.formGroup.value.subarea_uuid,
          title: 'DR', // Assuming title is the subarea name
          asm_uuid: this.currentUser.asm_uuid,
          sup_uuid: this.currentUser.sup_uuid,
          signature: this.currentUser.fullname,
        };
        console.log('body:', body);
        this.drService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'DR',
              this.currentUser.uuid,
              'created',
              `Created new DR uuid: ${res.data.uuid}`,
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
      var body: IDr = {
        country_uuid: this.currentUser.country_uuid,
        province_uuid: this.currentUser.province_uuid,
        area_uuid: this.currentUser.area_uuid,
        subarea_uuid: this.formGroup.value.subarea_uuid,
        title: 'DR', // Assuming title is the subarea name
        asm_uuid: this.currentUser.asm_uuid,
        sup_uuid: this.currentUser.sup_uuid,
        signature: this.currentUser.fullname,
      };
      this.drService.update(this.uuidItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'DR',
              this.currentUser.uuid,
              'updated',
              `Updated DR uuid: ${res.data.uuid}`,
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
    this.uuidItem = value;
    this.drService.get(this.uuidItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        subarea_uuid: this.dataItem.subarea_uuid,
        asm_uuid: this.dataItem.asm_uuid,
        sup_uuid: this.dataItem.sup_uuid,
      });
    });
  }



  delete(): void {
    this.drService
      .delete(this.uuidItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'DR',
            this.currentUser.uuid,
            'deleted',
            `Delete DR uuid: ${this.uuidItem}`,
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
      });
  }

  compareFn(c1: ICountry, c2: ICountry): boolean {
    return c1 && c2 ? c1.uuid === c2.uuid : c1 === c2;
  }

  compareProvinceFn(c1: IProvince, c2: IProvince): boolean {
    return c1 && c2 ? c1.uuid === c2.uuid : c1 === c2;
  }

  compareAREAFn(c1: IArea, c2: IArea): boolean {
    return c1 && c2 ? c1.uuid === c2.uuid : c1 === c2;
  }

  compareSubAREAFn(c1: ISubArea, c2: ISubArea): boolean {
    return c1 && c2 ? c1.uuid === c2.uuid : c1 === c2;
  }

  compareASMFn(c1: IAsm, c2: IAsm): boolean {
    return c1 && c2 ? c1.uuid === c2.uuid : c1 === c2;
  }

  compareSUPFn(c1: ISup, c2: ISup): boolean {
    return c1 && c2 ? c1.uuid === c2.uuid : c1 === c2;
  }

  compareUserFn(c1: IUser, c2: IUser): boolean {
    return c1 && c2 ? c1.uuid === c2.uuid : c1 === c2;
  }



}

