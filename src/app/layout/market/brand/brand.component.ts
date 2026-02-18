import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, DestroyRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../auth/auth.service';
import { routes } from '../../../shared/routes/routes'; 
import { CountryService } from '../../territories/country/country.service';
import { ICountry } from '../../territories/country/models/country.model'; 
import { LogsService } from '../../management/user-logs/logs.service';
import { IUser } from '../../management/user/models/user.model';
import { IProvince } from '../../territories/province/models/province.model';
import { ProvinceService } from '../../territories/province/province.service';
import { IBrand } from './models/brand.model';
import { BrandService } from './brand.service';
import { IPosFormItem } from '../posform/models/posform_item.model';
import { db } from '../../../shared/services/db';
import { liveQuery } from 'dexie';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';

@Component({
  selector: 'app-brand',
  standalone: false,
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss'
})
export class BrandComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly brandService = inject(BrandService);
  private readonly provinceService = inject(ProvinceService);
  private readonly countryService = inject(CountryService);
  private readonly logActivity = inject(LogsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoadingData = signal(false);
  public routes = routes;

  readonly dataList = signal<IBrand[]>([]);
  readonly total_pages = signal(0);
  readonly page_size = signal(15);
  readonly current_page = signal(1);
  readonly total_records = signal(0);

  displayedColumns: string[] = ['country', 'province', 'name', 'posformitem', 'uuid'];
  readonly dataSource = new MatTableDataSource<IBrand>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly search = signal('');

  readonly idItem = signal('');
  readonly dataItem = signal<IBrand | null>(null);

  readonly formGroup = signal<FormGroup>(this._formBuilder.group({
    name: ['', Validators.required],
    country_uuid: ['', Validators.required],
    province_uuid: ['', Validators.required],
  }));
  readonly currentUser = signal<IUser | null>(null);
  readonly isLoading = signal(false);

  readonly countryList = signal<ICountry[]>([]);
  readonly provinceList = signal<IProvince[]>([]);
  readonly provinceFilterList = signal<IProvince[]>([]);

  readonly dataListLocal = signal<IBrand[]>([]);
  readonly isOnLine = signal(navigator.onLine);


  ngAfterViewInit(): void {
    this.authService.user().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cdr.detectChanges();

        this.brandService.refreshDataList$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.fetchProducts(this.currentUser()!);
        });
        this.fetchProducts(this.currentUser()!);

        this.countryService.getAll().subscribe(res => {
          this.countryList.set(res.data);
        });
        this.provinceService.getAll().subscribe(res => {
          this.provinceList.set(res.data);
        });
      },
      error: (error) => {
        this.isLoadingData.set(false);
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }


  ngOnInit() {
    this.isLoadingData.set(true);
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1);
    this.page_size.set(event.pageSize);
    this.fetchProducts(this.currentUser()!);
  }

  fetchProducts(currentUser: IUser) { 
    if (currentUser.role == 'Manager') {
      this.brandService.getBrandsPaginated(this.current_page(), this.page_size(), this.search()).subscribe({
        next: (res) => {
          if (res && res.data) {
            this.dataList.set(res.data);
            this.total_pages.set(res.pagination.total_pages);
            this.total_records.set(res.pagination.total_records);
            this.dataSource.data = res.data;
          }
          this.isLoadingData.set(false);
        },
        error: (err) => {
          console.error('Error fetching brands:', err);
          this.isLoadingData.set(false);
          this.toastr.error('Erreur lors du chargement des données', 'Erreur!');
        }
      });
    } else if (currentUser.role == 'ASM') {
      this.brandService.getBrandsByProvinceId(currentUser.province_uuid, 
        this.current_page(), this.page_size(), this.search()).subscribe({
        next: (res) => {
          if (res && res.data) {
            this.dataList.set(res.data);
            console.log(this.dataList());
            this.total_pages.set(res.pagination.total_pages);
            this.total_records.set(res.pagination.total_records);
            this.dataSource.data = res.data;
          }
          this.isLoadingData.set(false);
        },
        error: (err) => {
          console.error('Error fetching brands:', err);
          this.isLoadingData.set(false);
          this.toastr.error('Erreur lors du chargement des données', 'Erreur!');
        }
      });
    } else {
      this.brandService.getBrandsPaginated(this.current_page(), this.page_size(), this.search()).subscribe({
        next: (res) => {
          if (res && res.data) {
            this.dataList.set(res.data);
            this.total_pages.set(res.pagination.total_pages);
            this.total_records.set(res.pagination.total_records);
            this.dataSource.data = res.data;
          }
          this.isLoadingData.set(false);
        },
        error: (err) => {
          console.error('Error fetching brands:', err);
          this.isLoadingData.set(false);
          this.toastr.error('Erreur lors du chargement des données', 'Erreur!');
        }
      });
    }
  }


  fecthlocalData() {
    liveQuery(() => db.brands.toArray()).subscribe(data => {
      this.dataListLocal.set(data);
      this.isLoadingData.set(false);
    });
  }

  onSearchChange(search: string) {
    this.search.set(search);
    this.fetchProducts(this.currentUser()!);
  }


  public sortData(sort: Sort) {
    const data = this.dataList().slice();
    if (!sort.active || sort.direction === '') {
      this.dataList.set(data);
    } else {
      const sorted = data.sort((a, b) => {
        const aValue = (a as never)[sort.active];
        const bValue = (b as never)[sort.active];
        return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
      });
      this.dataList.set(sorted);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onCountryChange(event: any) {
    const provinceArray = this.provinceList().filter((v) => v.country_uuid == event.value);
    this.provinceFilterList.set(provinceArray);
  }


  onSubmit() {
    try {
      if (this.formGroup().valid) {
        this.isLoading.set(true);
        var body: IBrand = {
          name: this.formGroup().value.name,
          country_uuid: this.formGroup().value.country_uuid,
          province_uuid: this.formGroup().value.province_uuid,
          signature: this.currentUser()!.fullname,
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
        };
        this.brandService.createBrand(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Brand',
              this.currentUser()!.uuid,
              'created',
              `Created new Brand uuid: ${res.data.uuid}`,
              this.currentUser()!.fullname
            ).subscribe({
              next: () => {
                this.isLoading.set(false);
                this.formGroup().reset();
                this.toastr.success('Ajouter avec succès!', 'Success!');
              },
              error: (err) => {
                this.isLoading.set(false);
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: (err) => {
            this.isLoading.set(false);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoading.set(false);
      console.log(error);
    }
  }

  onSubmitUpdate() {
    try {
      this.isLoading.set(true);
      var body: IBrand = {
        name: this.formGroup().value.name,
        country_uuid: this.formGroup().value.country_uuid,
        province_uuid: this.formGroup().value.province_uuid,
        signature: this.currentUser()!.fullname,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      };
      this.brandService.updateBrand(this.idItem(), body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Brand',
              this.currentUser()!.uuid,
              'updated',
              `Updated Brand uuid: ${res.data.uuid}`,
              this.currentUser()!.fullname
            ).subscribe({
              next: () => {
                this.formGroup().reset();
                this.toastr.success('Modification enregistré!', 'Success!');
                this.isLoading.set(false);
              },
              error: (err) => {
                this.isLoading.set(false);
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: err => {
            console.log(err);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            this.isLoading.set(false);
          }
        });
    } catch (error) {
      this.isLoading.set(false);
      console.log(error);
    }
  }

  findValue(value: string) {
    this.idItem.set(value);
    this.brandService.get(this.idItem()).subscribe(item => {
      this.dataItem.set(item.data);
      this.formGroup().patchValue({
        name: this.dataItem()!.name,
        country_uuid: this.dataItem()!.country_uuid,
        province_uuid: this.dataItem()!.province_uuid,
      });
    });
  }


  delete(): void {
    this.brandService
      .deleteBrand(this.idItem())
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Brand',
            this.currentUser()!.uuid,
            'deleted',
            `Delete Brand id: ${this.idItem()}`,
            this.currentUser()!.fullname
          ).subscribe({
            next: () => {
              this.formGroup().reset();
              this.toastr.info('Supprimé avec succès!', 'Success!');
              this.isLoading.set(false);
            },
            error: (err) => {
              this.isLoading.set(false);
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

