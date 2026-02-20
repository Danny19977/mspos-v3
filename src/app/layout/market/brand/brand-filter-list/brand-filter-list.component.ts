import { ChangeDetectorRef, Component, OnInit, ViewChild, signal, inject, DestroyRef, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ICountry } from '../../../territories/country/models/country.model';
import { IProvince } from '../../../territories/province/models/province.model';
import { routes } from '../../../../shared/routes/routes';
import { IBrand } from '../models/brand.model';
import { IUser } from '../../../management/user/models/user.model';
import { AuthService } from '../../../../auth/auth.service';
import { BrandService } from '../brand.service';
import { ProvinceService } from '../../../territories/province/province.service';
import { CountryService } from '../../../territories/country/country.service';
import { LogsService } from '../../../management/user-logs/logs.service';
import { IPosFormItem } from '../../posform/models/posform_item.model';
import { SyncQueueService } from '../../../../shared/services/sync-queue.service';
import { DataSyncService } from '../../../../shared/services/data-sync.service';

@Component({
  selector: 'app-brand-filter-list',
  standalone: false,
  templateUrl: './brand-filter-list.component.html',
  styleUrl: './brand-filter-list.component.scss'
})
export class BrandFilterListComponent implements OnInit, AfterViewInit {
  // Services avec inject()
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly brandService = inject(BrandService);
  private readonly provinceService = inject(ProvinceService);
  private readonly countryService = inject(CountryService);
  private readonly logActivity = inject(LogsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly syncQueueService = inject(SyncQueueService);
  private readonly dataSyncService = inject(DataSyncService);

  // Sync status signals
  readonly isUploadSyncing = signal<boolean>(false);
  readonly isDownloadSyncing = signal<boolean>(false);
  readonly pendingUploadCount = signal<number>(0);
  readonly downloadEntity = signal<string>('');

  // Signals pour l'état du composant
  readonly isLoadingData = signal(false);
  readonly routes = routes;
  readonly dataList = signal<IBrand[]>([]);
  readonly total_pages = signal(0);
  readonly page_size = signal(15);
  readonly current_page = signal(1);
  readonly total_records = signal(0);
  readonly displayedColumns = signal<string[]>(['country', 'province', 'name', 'posformitem', 'uuid']);
  readonly dataSource = new MatTableDataSource<IBrand>([]);
  readonly search = signal('');
  readonly idItem = signal('');
  readonly dataItem = signal<IBrand | undefined>(undefined);
  readonly formGroup = signal<FormGroup>(new FormGroup({}));
  readonly currentUser = signal<IUser | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly countryList = signal<ICountry[]>([]);
  readonly provinceList = signal<IProvince[]>([]);
  readonly provinceFilterList = signal<IProvince[]>([]);
  readonly name = signal('');
  readonly territoire_uuid = signal('');
  readonly territoire = signal<any>(undefined);

  /** Flag pour éviter de re-télécharger tous les Brands à chaque appel de fetchProducts */
  private hasDownloadedAllBrands = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;


  ngAfterViewInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.name.set(params['name']);
        this.territoire_uuid.set(params['uuid']);
        this.authService.user().subscribe({
          next: (user) => {
            this.currentUser.set(user);
            this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
            this.dataSource.sort = this.sort; // Bind sort to dataSource
            this.cdr.detectChanges(); // Trigger change detection

            this.brandService.refreshDataList$
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.fetchProducts(this.name(), this.territoire_uuid());
              });
            this.fetchProducts(this.name(), this.territoire_uuid());

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
      });
  }


  ngOnInit() {
    this.isLoadingData.set(true);

    this.syncQueueService.isSyncing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(syncing => this.isUploadSyncing.set(syncing));

    this.syncQueueService.pendingCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => this.pendingUploadCount.set(count));

    this.dataSyncService.syncProgress$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(progress => {
        this.isDownloadSyncing.set(!progress.isComplete && progress.total > 0);
        this.downloadEntity.set(progress.entity);
      });

    this.formGroup.set(this.formBuilder.group({
      name: ['', Validators.required],
      country_uuid: ['', Validators.required],
      province_uuid: ['', Validators.required],
    }));
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1); // Adjust for 1-based page index
    this.page_size.set(event.pageSize);
    this.fetchProducts(this.name(), this.territoire_uuid());
  }

  fetchProducts(name: string, territoire_uuid: string) {
    // Télécharger l'intégralité des Brands du territoire vers le cache local (une seule fois par session)
    if (!this.hasDownloadedAllBrands) {
      this.hasDownloadedAllBrands = true;
      this.brandService.downloadAllCloudBrandsByTerritoryToLocal(name, territoire_uuid);
    }

    console.log("name", name);
    if (name == "country") {
      this.countryService.get(territoire_uuid).subscribe(item => {
        this.territoire.set(item.data);

        this.brandService.getPaginatedByCountryUUId(territoire_uuid, this.current_page(), this.page_size(), this.search()).subscribe(res => {
          this.dataList.set(res.data);
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.dataSource.data = this.dataList(); // Update dataSource data
          this.isLoadingData.set(false);
        });
      });
    } else if (name == "province") {
      this.provinceService.get(territoire_uuid).subscribe(item => {
        this.territoire.set(item.data);

        this.brandService.getBrandsByProvinceId(territoire_uuid, this.current_page(), this.page_size(), this.search()).subscribe(res => {
          this.dataList.set(res.data);
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.dataSource.data = this.dataList(); // Update dataSource data
          this.isLoadingData.set(false);
        });
      });
    }

  }


  onSearchChange(search: string) {
    this.search.set(search);
    this.fetchProducts(this.name(), this.territoire_uuid());
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


  getPostFormItemCount(postFormItem: IPosFormItem[]): string {
    return postFormItem ? postFormItem.length > 0 ? postFormItem.length.toString() : '0' : '0';
  }

  onCountryChange(event: any) {
    const provinceArray = this.provinceList().filter((v) => v.country_uuid == event.value);
    this.provinceFilterList.set(provinceArray);
  }


  onSubmit() {
    try {
      const currentUser = this.currentUser();
      if (this.formGroup().valid && currentUser) {
        this.isLoading.set(true);
        const formValue = this.formGroup().value;
        var body: IBrand = {
          name: formValue.name,
          country_uuid: formValue.country_uuid,
          province_uuid: formValue.province_uuid,
          signature: currentUser.fullname,
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
        };
        this.brandService.createBrand(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Brand',
              currentUser.uuid,
              'created',
              `Created new Brand uuid: ${res.data.uuid}`,
              currentUser.fullname
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
      const currentUser = this.currentUser();
      if (!currentUser) {
        this.isLoading.set(false);
        return;
      }
      const formValue = this.formGroup().value;
      var body: IBrand = {
        name: formValue.name,
        country_uuid: formValue.country_uuid,
        province_uuid: formValue.province_uuid,
        signature: currentUser.fullname,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      };
      this.brandService.updateBrand(this.idItem(), body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Brand',
              currentUser.uuid,
              'updated',
              `Updated Brand uuid: ${res.data.uuid}`,
              currentUser.fullname
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
      const currentItem = this.dataItem();
      if (currentItem) {
        this.formGroup().patchValue({
          name: currentItem.name,
          country_uuid: currentItem.country_uuid,
          province_uuid: currentItem.province_uuid,
        });
      }
    });
  }


  delete(): void {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    this.brandService
      .deleteBrand(this.idItem())
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Brand',
            currentUser.uuid,
            'deleted',
            `Delete Brand id: ${this.idItem()}`,
            currentUser.fullname
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


