import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, inject, signal, WritableSignal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeolocationService } from '@ng-web-apis/geolocation';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPosForm } from '../models/posform.model';
import { PosformService } from '../posform.service';
import { IUser } from '../../../management/user/models/user.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../../management/user-logs/logs.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { formatDate } from '@angular/common';
// import { v4 as uuidv4 } from 'uuid'; 
import { IPosFormItem } from '../models/posform_item.model';
import { PosformItemService } from '../posformitem.service';
import { IRoutePlan } from '../../routeplan/models/routeplan.model';
import { IRoutePlanItem } from '../../routeplan/models/routeplanItem.model';
import { IBrand } from '../../brand/models/brand.model';
import { BrandService } from '../../brand/brand.service';
import { RouteplanService } from '../../routeplan/routeplan.service';
import { RouteplanItemService } from '../../routeplan/routeplanitem.service';
import { CountryService } from '../../../territories/country/country.service';
import { ProvinceService } from '../../../territories/province/province.service';
import { AreaService } from '../../../territories/areas/area.service';
import { SubareaService } from '../../../territories/subarea/subarea.service';
import { CommuneService } from '../../../territories/commune/commune.service';
import { NetworkService } from '../../../../services/network.service';
import { SyncQueueService } from '../../../../shared/services/sync-queue.service';
import { DataSyncService } from '../../../../shared/services/data-sync.service';


@Component({
  selector: 'app-posform-filter',
  standalone: false,
  templateUrl: './posform-filter.component.html',
  styleUrl: './posform-filter.component.scss'
})
export class PosformFilterComponent implements OnInit, AfterViewInit {
  // Modern Angular signals
  isLoadingData = signal(false);
  public routes = routes;

  dateRange!: FormGroup;
  start_date = signal<string>('');
  end_date = signal<string>('');
  rangeDate: any[] = [];

  dataList = signal<IPosForm[]>([]);
  total_pages = signal(0);
  page_size = signal(15);
  current_page = signal(1);
  total_records = signal(0);

  // Table
  // Table
  displayedColumns: string[] = [
    'sync_status',
    'createdat',
    'pos',
    'price',
    'asm',
    'sup',
    'dr',
    'cyclo',
    'brand',
    'comment',
    'action'
  ];
  dataSource = new MatTableDataSource<IPosForm>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = signal('');

  // Propriétés pour les filtres avancés
  showAdvancedFilters = signal(false);

  // Objet contenant les filtres supportés par le backend
  // Backend: search (comment), price, asm, sup, dr, cyclo
  filters = {
    price: '',
    asm: '',
    supervisor: '',  // envoyé comme "sup" au backend
    dr: '',
    cyclo: ''
  };

  // Listes des valeurs uniques pour les filtres hiérarchie commerciale
  uniqueAsms = signal<string[]>([]);
  uniqueSupervisors = signal<string[]>([]);
  uniqueDrs = signal<string[]>([]);
  uniqueCyclos = signal<string[]>([]);
  uniquePrices = signal<number[]>([]);

  // Listes filtrées pour la hiérarchie commerciale
  filteredAsms = signal<string[]>([]);
  filteredSupervisors = signal<string[]>([]);
  filteredDrs = signal<string[]>([]);
  filteredCyclos = signal<string[]>([]);

  // Données originales et filtrées
  originalDataList = signal<IPosForm[]>([]);
  filteredDataList = signal<IPosForm[]>([]);

  // Flag pour indiquer si on est en train de compléter un rapport
  isCompletingReport = signal(false);

  // Forms posform
  uuidItem = signal(''); // UUID of the item to be edited or deleted
  dataItem = signal<IPosForm | null>(null); // Single data 

  // posformItem
  uuidPosformItem = signal(''); // UUID of the posformitem to be edited or deleted
  dataPosformItem = signal<IPosFormItem | null>(null); // Single data

  // PosFormItem list
  dataListPosFormItem = signal<IPosFormItem[]>([]);


  // FormGroup for the main form posform
  formGroup!: FormGroup;
  currentUser = signal<IUser | null>(null);
  isLoading = signal(false);

  // FormGroup for the posformitem
  formGroupPosFormItem!: FormGroup;
  isLoadingPosFormItem = signal(false);

  // Geolocation
  latitude = signal<number>(0);
  longitude = signal<number>(0);

  priceList: string[] = ['100', '125', '150', '200', '250', '300'];

  // Get single Routeplan
  routePlan = signal<IRoutePlan | null>(null);
  routePlanItemList = signal<IRoutePlanItem[]>([]);
  routePlanItemListFilter = signal<IRoutePlanItem[]>([]);
  filteredOptions = signal<IRoutePlanItem[]>([]);

  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  isload = signal(false);
  posUUID = signal('');
  posName = signal('');

  // Liste brands
  brandList = signal<IBrand[]>([]);
  brandListFilter = signal<IBrand[]>([]);
  filteredOptionBrand = signal<IBrand[]>([]);
  isLoadingBrand = signal(false);

  @ViewChild('brand_uuid') brand_uuid!: ElementRef<HTMLInputElement>;
  isloadBrand = signal(false);
  brandUUID = signal('');
  brandName = signal('');

  // Ajouter une nouvelle propriété pour stocker l'UUID du routePlanItem
  routePlanItemUUID = signal('');

  name = signal('');
  territoire_uuid = signal('');
  territoire = signal<any>(null);

  // Modern Angular inject pattern
  private readonly geolocation$ = inject(GeolocationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private posformService = inject(PosformService);
  private posformItemService = inject(PosformItemService);
  private brandService = inject(BrandService);
  private routePlanService = inject(RouteplanService);
  private routePlanItemService = inject(RouteplanItemService);
  private countryService = inject(CountryService);
  private provinceService = inject(ProvinceService);
  private areaService = inject(AreaService);
  private subareaService = inject(SubareaService);
  private communeService = inject(CommuneService);
  private logActivity = inject(LogsService);
  private toastr = inject(ToastrService);
  private cdr = inject(ChangeDetectorRef);
  private readonly networkService = inject(NetworkService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly syncQueueService = inject(SyncQueueService);
  private readonly dataSyncService = inject(DataSyncService);

  // Sync status signals
  isUploadSyncing = signal<boolean>(false);
  isDownloadSyncing = signal<boolean>(false);
  pendingUploadCount = signal<number>(0);
  downloadEntity = signal<string>('');

  isOnline = signal(navigator.onLine);

  constructor() {
    this.geolocation$.subscribe((position) => {
      this.latitude.set(position.coords.latitude);
      this.longitude.set(position.coords.longitude);
      console.log('Latitude:', this.latitude(), 'Longitude:', this.longitude());
    });
  }


  ngAfterViewInit(): void {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1); // First day of the current month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1); // First day of the next month
    lastDay.setDate(lastDay.getDate() + 1); // Add 1 day to the last day
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      rangeValue: new FormControl(this.rangeDate),
    });
    this.start_date.set(formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US'));
    this.end_date.set(formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US'));

    this.route.params.subscribe(params => {
      this.name.set(params['name']);
      this.territoire_uuid.set(params['uuid']);
      this.authService.user().subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
          this.dataSource.sort = this.sort; // Bind sort to dataSource 
          this.cdr.detectChanges(); // Trigger change detection

          const user_data = this.currentUser();
          if (user_data && user_data.province_uuid != '') {
            this.getAllRoutePlans();
            this.getAllBrand();
          }

          this.posformService.refreshDataList$.subscribe(() => {
            this.getDataList(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
          });
          this.getDataList(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());

          this.onChanges();

          // Reconnect handler: refresh data when coming back online
          this.networkService.getNetworkStatus().subscribe(online => {
            this.isOnline.set(online);
            if (online) {
              this.getAllRoutePlans();
              this.getAllBrand();
              this.getDataList(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
            }
          });

          this.geolocation$.subscribe((position) => {
            this.latitude.set(position.coords.latitude);
            this.longitude.set(position.coords.longitude);
            // console.log('Latitude:', position.coords.latitude);
            // console.log('Longitude:', position.coords.longitude);
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

    this.formGroup = this._formBuilder.group({
      pos_uuid: ['', Validators.required],
      price: [0, Validators.required],
      comment: ['Rien à signaler', Validators.required],
    });

    this.formGroupPosFormItem = this._formBuilder.group({
      number_farde: ['', Validators.required],
      sold: [0, Validators.required],
    });
  }

  // Pour obtenir la liste des pos pour le plan de route
  getAllRoutePlans(): void {
    const filterValue = this.pos_uuid?.nativeElement.value.toLowerCase() || '';
    this.isload.set(true);

    const user = this.currentUser();
    if (!user) return;

    this.routePlanService.getTodayRoutePlanOfflineFirst(user.uuid).subscribe({
      next: (plan) => {
        this.routePlan.set(plan);
        console.log('Route Plan:', plan);
        if (plan && plan.uuid) {
          this.routePlanItemService.getAllById(plan.uuid!).subscribe({
            next: (r) => {
              this.routePlanItemList.set(r.data);

              // Extraire les pos_uuid déjà utilisés dans les posforms existants
              // Mais exclure le pos_uuid actuel si on modifie un rapport existant
              // Filtrer uniquement les posforms d'aujourd'hui (de 0h00 à 23h59)
              const today = new Date();
              const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
              const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

              const usedPosUuids = this.dataList()
                .filter(posform => {
                  // Exclure le rapport actuel
                  if (posform.uuid === this.uuidItem()) return false;

                  // Filtrer uniquement les posforms d'aujourd'hui
                  if (posform.CreatedAt) {
                    const createdDate = new Date(posform.CreatedAt);
                    return createdDate >= startOfDay && createdDate <= endOfDay;
                  }
                  return false;
                })
                .map(posform => posform.pos_uuid)
                .filter(uuid => uuid !== null && uuid !== undefined);

              // Filtrer les items du route plan pour exclure ceux qui ont le status false ET qui ne sont pas déjà utilisés
              const filteredList = this.routePlanItemList().filter(pos =>
                pos.uuid &&
                pos.status == false &&
                !usedPosUuids.includes(pos.pos_uuid)
              );
              this.routePlanItemListFilter.set(filteredList);

              const filteredOpts = filteredList.filter(o => o.Pos!.name.toLowerCase().includes(filterValue));
              this.filteredOptions.set(filteredOpts);
              this.isload.set(false);
            },
            error: (error) => {
              this.isload.set(false);
              console.error('Error fetching route plan items:', error);
              this.toastr.info('Veuillez créer un plan de route.', 'Plan de route inexistant');
            }
          });
        };
        this.isload.set(false);
      },
      error: (error) => {
        this.isload.set(false);
        console.error('Error fetching route plans:', error);
        this.toastr.error('Erreur lors de la récupération des plans de route.', 'Oupss!');
      }
    });
  }

  displayFn(item: IRoutePlanItem): any {
    if (!item) return '';
    if (!item.Pos) return '';
    return item.Pos.name || '';
  }

  // Modifier la méthode optionSelected pour capturer l'UUID du routePlanItem
  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posUUID.set(selectedOption.pos_uuid);
    this.posName.set(selectedOption.pos_name);
    // ✅ Capturer l'UUID du routePlanItem sélectionné
    this.routePlanItemUUID.set(selectedOption.uuid); // Ceci est l'UUID du routePlanItem, pas du POS
  }

  // Pour obtenir la liste des marques visitées
  getAllBrand(): void {
    const filterValue = this.brand_uuid?.nativeElement.value.toLowerCase() ?? '';
    this.isloadBrand.set(true);

    const user = this.currentUser();
    if (!user) return;

    this.brandService.getBrandsOfflineFirst(user.province_uuid).subscribe({
      next: (res) => {
        this.brandList.set(res.data);

        // Extraire les brand_uuid déjà utilisés dans les posformItems existants
        const usedBrandUuids = this.dataListPosFormItem().map(item => item.brand_uuid).filter(uuid => uuid !== null && uuid !== undefined);

        // Filtrer les brands pour exclure ceux qui sont déjà utilisés
        const filteredList = this.brandList().filter(brand =>
          brand.uuid &&
          !usedBrandUuids.includes(brand.uuid)
        );
        this.brandListFilter.set(filteredList);

        const filteredOpts = filteredList.filter(o => (o.name || '').toLowerCase().includes(filterValue));
        this.filteredOptionBrand.set(filteredOpts);
        this.isloadBrand.set(false);
      },
      error: (error) => {
        this.isloadBrand.set(false);
        console.error('Error fetching brand items:', error);
        this.toastr.error('Erreur lors de la récupération des marques.', 'Oupss!');
      }
    });
  }

  displayFnBrand(brand: IBrand): any {
    if (!brand) return '';
    return brand.name || '';
  }

  optionSelectedBrand(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.brandUUID.set(selectedOption.uuid);
    this.brandName.set(selectedOption.name);

    // Utilisez id et fullName comme vous le souhaitez
    console.log('brand_uuid:', this.brandUUID());
  }


  // Méthode onChanges
  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date.set(formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US'));

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date.set(formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US'));


      this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());

    });
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1); // Adjust for 1-based page index
    this.page_size.set(event.pageSize);

    this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
  }

  private getDataList(name: string, territoire_uuid: string, start_date: string, end_date: string): void {
    if (name == "country" || name == 'Manager' || name == 'Support') {
      this.countryService.get(territoire_uuid).subscribe(item => {
        this.territoire.set(item.data);
         this.fetchProducts(name, territoire_uuid, start_date, end_date);
      });
    } else if (name == "province" || name == "ASM") {
      this.provinceService.get(territoire_uuid).subscribe(item => {
        this.territoire.set(item.data);
        this.fetchProducts(name, territoire_uuid, start_date, end_date);
      });
    } else if (name == "area" || name == "Supervisor") {
      this.areaService.get(territoire_uuid).subscribe(item => {
        this.territoire.set(item.data);
        this.fetchProducts(name, territoire_uuid, start_date, end_date);
      });
    } else if (name == "subarea" || name == "DR") {
      this.subareaService.get(territoire_uuid).subscribe(item => {
        this.territoire.set(item.data);
        this.fetchProducts(name, territoire_uuid, start_date, end_date);
      }); 
    } else if (name == "commune" || name == "Cyclo") {
      this.communeService.get(territoire_uuid).subscribe(item => {
        this.territoire.set(item.data); 
        this.fetchProducts(name, territoire_uuid, start_date, end_date);
      });
    }
  }

  fetchProducts(name: string, territoire_uuid: string, start_date: string, end_date: string): void {
    this.isLoadingData.set(true);

    // Filtres supportés par le backend (ApplyCommonFilters)
    const apiFilters = {
      search: this.search(),
      price: this.filters.price,
      asm: this.filters.asm,
      supervisor: this.filters.supervisor,  // envoyé comme "sup" dans le service
      dr: this.filters.dr,
      cyclo: this.filters.cyclo
    };

    // Mode OFFLINE : lire depuis le cache local
    if (!this.isOnline()) {
      this.posformService.getPaginatedOfflineFirstByTerritory(
        name,
        territoire_uuid,
        this.current_page(),
        this.page_size(),
        start_date,
        end_date,
        apiFilters
      ).subscribe({
        next: (res) => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.updateUniqueValues();
          this.dataSource.data = this.dataList();
          this.getAllRoutePlans();
          this.isLoadingData.set(false);
        },
        error: (err) => {
          console.error('Erreur cache local posforms:', err);
          this.isLoadingData.set(false);
        }
      });
      return;
    }

    // Mode ONLINE : utiliser la nouvelle méthode avec filtres avancés pour tous les rôles
    this.posformService.getPaginatedWithAdvancedFilters2(
      name,
      territoire_uuid,
      this.current_page(),
      this.page_size(),
      start_date,
      end_date,
      apiFilters
    ).subscribe({
      next: (res) => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]); // Sauvegarder les données originales
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);

        // Mettre à jour les valeurs uniques pour les filtres frontend (si nécessaire)
        this.updateUniqueValues();

        // Puisque les filtres sont maintenant appliqués côté serveur,
        // nous n'avons plus besoin d'appliquer les filtres côté client
        this.dataSource.data = this.dataList();

        this.getAllRoutePlans(); // Refresh route plans to exclude used POS
        this.isLoadingData.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des posforms:', error);
        this.isLoadingData.set(false);

        // Fallback : utiliser les anciennes méthodes selon le rôle
        this.fetchProductsFallback(this.name(), this.territoire_uuid(), start_date, end_date);
      }
    });
  }

  /**
   * Méthode de fallback utilisant les anciennes endpoints si les filtres avancés échouent
   */
  private fetchProductsFallback(name: string, territoire_uuid: string, start_date: string, end_date: string): void {
    if (name == "country" || name == 'Manager' || name == 'Support') {
      this.countryService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        this.posformService.getPaginatedRangeDateByCountryUUID(
          territoire_uuid,
          this.current_page(),
          this.page_size(), this.search(),
          start_date, end_date).subscribe(res => {
            this.dataList.set(res.data);
            this.originalDataList.set([...res.data]);
            this.total_pages.set(res.pagination.total_pages);
            this.total_records.set(res.pagination.total_records);
            this.updateUniqueValues();
            this.applyFilters();
            this.getAllRoutePlans();
            this.isLoadingData.set(false);
          });
      });
    } else if (name == 'province' || name == 'ASM') {
      this.provinceService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        this.posformService.getPaginatedRangeDateByProvinceId(
          territoire_uuid, this.current_page(), this.page_size(), this.search(),
          start_date, end_date).subscribe(res => {
            this.dataList.set(res.data);
            this.originalDataList.set([...res.data]);
            this.total_pages.set(res.pagination.total_pages);
            this.total_records.set(res.pagination.total_records);
            this.updateUniqueValues();
            this.applyFilters();
            this.getAllRoutePlans();
            this.isLoadingData.set(false);
          });
      });
    } else if (name == 'area' || name == 'Supervisor') {
      this.areaService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        this.posformService.getPaginatedRangeDateByAreaId(
          territoire_uuid,
          this.current_page(),
          this.page_size(),
          this.search(),
          start_date, end_date).subscribe(res => {
            this.dataList.set(res.data);
            this.originalDataList.set([...res.data]);
            this.total_pages.set(res.pagination.total_pages);
            this.total_records.set(res.pagination.total_records);
            this.updateUniqueValues();
            this.applyFilters();
            this.getAllRoutePlans();
            this.isLoadingData.set(false);
          });
      });
    } else if (name == 'subarea' || name == 'DR') {
      this.subareaService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        this.posformService.getPaginatedRangeDateBySubAreaId(
          territoire_uuid, this.current_page(), this.page_size(), this.search(),
          start_date, end_date).subscribe(res => {
            this.dataList.set(res.data);
            this.originalDataList.set([...res.data]);
            this.total_pages.set(res.pagination.total_pages);
            this.total_records.set(res.pagination.total_records);
            this.updateUniqueValues();
            this.applyFilters();
            this.getAllRoutePlans();
            this.isLoadingData.set(false);
          });
      });
    } else if (name == 'commune' || name == 'Cyclo') {
      this.communeService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        const user = this.currentUser();
        if (user) {
          this.posformService.getPaginatedRangeDateByCommuneId(
            user.uuid, this.current_page(), this.page_size(), this.search(),
            start_date, end_date).subscribe(res => {
              this.dataList.set(res.data);
              this.originalDataList.set([...res.data]);
              this.total_pages.set(res.pagination.total_pages);
              this.total_records.set(res.pagination.total_records);
              this.updateUniqueValues();
              this.applyFilters();
              this.getAllRoutePlans();
              this.isLoadingData.set(false);
            });
        }
      });
    } else {
      this.posformService.getPaginatedRangeDate2(
        this.current_page(), this.page_size(), this.search(),
        start_date, end_date).subscribe(res => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.updateUniqueValues();
          this.applyFilters();
          this.getAllRoutePlans();
          this.isLoadingData.set(false);
        });
    }
  }

  onSearchChange(search: string) {
    this.search.set(search);
    this.current_page.set(1); // Reset à la première page lors de la recherche
    this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
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

  // Méthodes pour les filtres avancés

  /**
   * Afficher/masquer les filtres avancés
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(val => !val);
  }

  /**
   * Mettre à jour les valeurs uniques pour tous les filtres
   */
  updateUniqueValues(): void {
    const dataList = this.originalDataList();

    // Prix
    this.uniquePrices.set([...new Set(dataList
      .map((item: IPosForm) => item.price)
      .filter((price: number | null | undefined) => price !== null && price !== undefined))]
      .sort((a, b) => (a as number) - (b as number)) as number[]);

    // Hiérarchie commerciale (colonnes directes supportées par le backend)
    this.uniqueAsms.set([...new Set(dataList
      .map((item: IPosForm) => item.asm)
      .filter((asm: string | undefined) => asm))] as string[]);

    this.uniqueSupervisors.set([...new Set(dataList
      .map((item: IPosForm) => item.sup)
      .filter((sup: string | undefined) => sup))] as string[]);

    this.uniqueDrs.set([...new Set(dataList
      .map((item: IPosForm) => item.dr)
      .filter((dr: string | undefined) => dr))] as string[]);

    this.uniqueCyclos.set([...new Set(dataList
      .map((item: IPosForm) => item.cyclo)
      .filter((cyclo: string | undefined) => cyclo))] as string[]);

    // Initialiser les listes filtrées
    this.filteredAsms.set([...this.uniqueAsms()]);
    this.filteredSupervisors.set([...this.uniqueSupervisors()]);
    this.filteredDrs.set([...this.uniqueDrs()]);
    this.filteredCyclos.set([...this.uniqueCyclos()]);
  }

  /**
   * Appliquer tous les filtres - Maintenant optimisé côté serveur
   */
  applyFilters(): void {
    // Au lieu de filtrer côté client, on déclenche un nouveau fetch avec les filtres
    this.current_page.set(1); // Reset à la première page lors de l'application de filtres
    this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
  }

  /**
   * Méthode héritée pour le filtrage côté client (utilisée comme fallback)
   */
  /**
   * Fallback: filtrage côté client (champs supportés par le backend uniquement)
   */
  applyClientSideFilters(): void {
    let filteredData = [...this.originalDataList()];

    if (this.filters.price) {
      filteredData = filteredData.filter(item =>
        item.price === Number(this.filters.price)
      );
    }
    if (this.filters.asm) {
      filteredData = filteredData.filter(item =>
        item.asm === this.filters.asm
      );
    }
    if (this.filters.supervisor) {
      filteredData = filteredData.filter(item =>
        item.sup === this.filters.supervisor
      );
    }
    if (this.filters.dr) {
      filteredData = filteredData.filter(item =>
        item.dr === this.filters.dr
      );
    }
    if (this.filters.cyclo) {
      filteredData = filteredData.filter(item =>
        item.cyclo === this.filters.cyclo
      );
    }

    this.filteredDataList.set(filteredData);
    this.dataSource.data = filteredData;
  }

  /**
   * Effacer tous les filtres
   */
  clearAllFilters(): void {
    this.filters = {
      price: '',
      asm: '',
      supervisor: '',
      dr: '',
      cyclo: ''
    };

    this.filteredAsms.set([...this.uniqueAsms()]);
    this.filteredSupervisors.set([...this.uniqueSupervisors()]);
    this.filteredDrs.set([...this.uniqueDrs()]);
    this.filteredCyclos.set([...this.uniqueCyclos()]);

    this.applyFilters();
  }

  /**
   * Déclencher l'application des filtres quand un filtre change
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Vérifier s'il y a des filtres actifs
   */
  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(value => value !== '');
  }

  /**
   * Compter le nombre de filtres actifs
   */
  getActiveFiltersCount(): number {
    return Object.values(this.filters).filter(value => value !== '').length;
  }

  /**
   * Obtenir le nombre d'éléments filtrés
   */
  getFilteredCount(): number {
    return this.dataList().length;
  }

  /**
   * Méthode pour vérifier si une date est inférieure à 24 heures
   */
  isLessThan24HoursOld(date: Date): boolean {
    const now = new Date();
    const itemDate = new Date(date);
    const hoursDifference = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
    return hoursDifference < 24;
  }

  /**
   * Méthode pour vérifier si l'utilisateur actuel est le créateur du posform
   */
  isCurrentUserCreator(posform: IPosForm): boolean {
    const user = this.currentUser();
    return user !== null && posform.user_uuid === user.uuid;
  }

  /**
   * Appliquer un filtre de date rapide
   */
  applyQuickDateFilter(value: string): void {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setDate(endDate.getDate() + 1); // Ajouter 1 jour pour inclure la date de fin

    switch (value) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        this.applyFilters();
        return;
    }

    // Mettre à jour le FormControl de dateRange
    this.dateRange.patchValue({
      rangeValue: [startDate, endDate]
    });

    // Déclencher le changement de date
    this.start_date.set(formatDate(startDate, 'yyyy-MM-dd', 'en-US'));
    this.end_date.set(formatDate(endDate, 'yyyy-MM-dd', 'en-US'));
    this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
  }

  /**
   * Exporter les données vers Excel via le backend
   */
  exportToExcel(): void {
    this.toastr.info('Préparation de l\'export Excel...', 'Export');

    const exportFilters = {
      search: this.search(),
      price: this.filters.price,
      asm: this.filters.asm,
      sup: this.filters.supervisor,
      dr: this.filters.dr,
      cyclo: this.filters.cyclo,
    };

    this.posformService.exportExcel(exportFilters, this.start_date(), this.end_date()).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `rapport_posform_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm', 'en-US')}.xlsx`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.toastr.success('Export Excel réussi!', 'Succès');
      },
      error: (error) => {
        console.error('Erreur lors de l\'export Excel:', error);
        this.toastr.error('Erreur lors de l\'export Excel', 'Erreur');
      }
    });
  }

  /**
   * Exporter les données vers PDF
   */
  exportToPDF(): void {
    try {
      // Créer le contenu HTML pour l'impression
      let htmlContent = `
        <html>
        <head>
          <title>Rapports de visite</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>📋 Rapports de visite</h2>
            <p>Exporté le ${formatDate(new Date(), 'dd/MM/yyyy HH:mm', 'en-US')}</p>
            <p class="summary">Total: ${this.getFilteredCount()} rapport(s) sur ${this.total_records()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Point de vente</th>
                <th>Localisation</th>
                <th>Coût</th>
                <th>Marques</th>
                <th>Commentaire</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
      `;

      this.filteredDataList().forEach((item: IPosForm) => {
        const location = [item.Province?.name, item.Area?.name, item.Commune?.name]
          .filter(l => l && l !== '--')
          .join(', ') || '--';

        htmlContent += `
          <tr>
            <td>${formatDate(item.CreatedAt || new Date(), 'dd/MM/yyyy', 'en-US')}</td>
            <td>${item.Pos?.name || 'Non renseigné'}</td>
            <td>${location}</td>
            <td>${item.price} FC</td>
            <td>${item.PosFormItems?.length || 0}</td>
            <td>${(item.comment || '--').substring(0, 50)}${item.comment && item.comment.length > 50 ? '...' : ''}</td>
            <td>${(item.pos_uuid && item.pos_uuid.trim() !== '') ? 'Complet' : 'Incomplet'}</td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      this.toastr.success('Export PDF initié!', 'Succès');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.toastr.error('Erreur lors de l\'export PDF', 'Erreur');
    }
  }

  /**
   * Méthodes manquantes pour le formulaire et les actions
   */

  findValue(uuid: string): void {
    console.log('🔍 findValue appelé avec uuid:', uuid);
    this.uuidItem.set(uuid);
    // Chercher d'abord dans les données filtrées, puis dans les données originales
    const foundItem = this.filteredDataList().find(item => item.uuid === uuid) ||
      this.originalDataList().find(item => item.uuid === uuid) ||
      this.dataList().find(item => item.uuid === uuid);

    if (foundItem) {
      this.dataItem.set(foundItem);
      console.log('✅ Élément trouvé:', this.dataItem());
      this.getAllPosFormItem(uuid);

      // Pré-remplir le formulaire d'édition
      this.formGroup.patchValue({
        pos_uuid: this.dataItem()?.pos_uuid || '',
        price: this.dataItem()?.price || '',
        comment: this.dataItem()?.comment || ''
      });

      // Si c'est un rapport incomplet (sans POS), adapter l'interface
      if (!this.dataItem()?.pos_uuid || this.dataItem()?.pos_uuid?.trim() === '') {
        console.log('📝 Rapport incomplet détecté, préparation pour complétion...');
        this.isCompletingReport.set(true);
        // Réinitialiser les sélections de POS pour permettre une nouvelle sélection
        this.posUUID.set('');
        this.posName.set('');
        this.formGroup.patchValue({
          pos_uuid: ''
        });
      } else {
        console.log('✅ Rapport complet détecté pour modification...');
        this.isCompletingReport.set(false);
        // Si le rapport a déjà un POS, on garde les valeurs existantes
        this.posUUID.set(this.dataItem()?.pos_uuid || '');
      }

      // Forcer la détection des changements pour s'assurer que l'offcanvas se met à jour
      this.cdr.detectChanges();
    } else {
      console.error('❌ Impossible de trouver l\'élément avec uuid:', uuid);
      this.toastr.error('Élément non trouvé', 'Erreur');
    }
  }


  // Creation de rapport de visite
  async onSubmitInit() {
    this.isLoading.set(true);
    const user = this.currentUser();
    if (!user) {
      this.toastr.error('Utilisateur non connecté', 'Erreur');
      this.isLoading.set(false);
      return;
    }
    
    var body: IPosForm = {
      // uuid: uuidv4(),
      price: 50,
      comment: 'Rien à signaler',
      latitude: this.latitude(),
      longitude: this.longitude(),
      pos_uuid: '', // This will be set later
      country_uuid: user.country_uuid || '',
      province_uuid: user.province_uuid || '',
      area_uuid: user.area_uuid || '',
      sub_area_uuid: user.sub_area_uuid || '',
      commune_uuid: user.commune_uuid || '',
      asm_uuid: user.asm_uuid || '',
      asm: user.asm || '',
      sup_uuid: user.sup_uuid || '',
      sup: user.sup || '',
      dr_uuid: user.dr_uuid || '',
      dr: user.dr || '',
      cyclo_uuid: user.cyclo_uuid || '',
      cyclo: user.cyclo || '',
      user_uuid: user.uuid,
      signature: user.fullname, // Added signature property
      // sync: true,
    };
    this.posformService.create(body).subscribe({
      next: (res) => {
        this.logActivity.activity(
          'PosForm',
          user.uuid,
          'created',
          `Created Posform uuid: ${res.data.uuid!}`, // 
          user.fullname
        ).subscribe({
          next: () => {
            this.formGroup.reset();
            this.dataListPosFormItem.set([]); // Réinitialiser la liste des items
            this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
            this.toastr.success('Nouveau rapport créé avec succès!', 'Succès');
            this.uuidItem.set(res.data.uuid!); // Définir l'UUID pour les ajouts d'items
            this.isLoading.set(false);
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
        this.toastr.error(`${err.error.message}`, 'Oupss!');
        console.log(err);
      }
    });
  }

  // Creation de rapport de visite
  onSubmit(): void {
    if (!this.canAddNewPosForm()) {
      this.toastr.warning('Vous devez d\'abord compléter le dernier PosForm en sélectionnant un POS.', 'Attention!');
      return;
    }

    if (this.formGroup.valid) {
      this.isLoading.set(true);

      const currentUserValue = this.currentUser();
      if (!currentUserValue) {
        this.toastr.error('Utilisateur non connect é', 'Erreur');
        this.isLoading.set(false);
        return;
      }

      const formData = {
        // ...this.formGroup.value,
        price: parseInt(this.formGroup.value.price) || 50,
        comment: this.formGroup.value.comment || '',
        pos_uuid: this.posUUID(),
        country_uuid: currentUserValue.country_uuid || '',
        province_uuid: currentUserValue.province_uuid || '',
        area_uuid: currentUserValue.area_uuid || '',
        sub_area_uuid: currentUserValue.sub_area_uuid || '',
        commune_uuid: currentUserValue.commune_uuid || '',
        asm_uuid: currentUserValue.asm_uuid || '',
        asm: currentUserValue.asm || '',
        sup_uuid: currentUserValue.sup_uuid || '',
        sup: currentUserValue.sup || '',
        dr_uuid: currentUserValue.dr_uuid || '',
        dr: currentUserValue.dr || '',
        cyclo_uuid: currentUserValue.cyclo_uuid || '',
        cyclo: currentUserValue.cyclo || '',
        user_uuid: currentUserValue.uuid,
        signature: '',
      };
      this.posformService.update(this.uuidItem(), formData).subscribe({
        next: (res) => {
          // Si un pos_uuid est fourni, mettre à jour le statut du routePlanItem à true
          const posUUIDValue = this.posUUID();
          if (posUUIDValue && posUUIDValue.trim() !== '') {
            this.routePlanItemService.update(this.routePlanItemUUID(), { status: true })
              .subscribe({
                next: () => {
                  console.log('Statut du RoutePlanItem mis à jour à true pour pos_uuid:', posUUIDValue);
                  this.getAllRoutePlans(); // Rafraîchir la liste des route plans
                },
                error: (err) => {
                  console.error('Erreur lors de la mise à jour du statut RoutePlanItem:', err);
                  // Ne pas bloquer le processus principal en cas d'erreur
                }
              });
          }
          this.logActivity.activity(
            'PosForm',
            currentUserValue.uuid,
            'updated',
            `Updated PosForm uuid: ${this.uuidItem()}`,
            currentUserValue.fullname
          ).subscribe({
            next: () => {
              this.toastr.success('Rapport modifié avec succès!', 'Succès');
              this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
              this.isLoading.set(false);
            },
            error: (err) => {
              this.isLoading.set(false);
              this.toastr.error('Erreur lors de la sauvegarde du log', 'Erreur');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires', 'Attention');
    }
  }


  onSubmitUpdate(): void {
    if (!this.canAddNewPosForm()) {
      this.toastr.warning('Vous devez d\'abord compléter le dernier PosForm en sélectionnant un POS.', 'Attention!');
      return;
    }
    if (this.formGroup.valid) {
      this.isLoading.set(true);

      const currentUserValue = this.currentUser();
      if (!currentUserValue) {
        this.toastr.error('Utilisateur non connecté', 'Erreur');
        this.isLoading.set(false);
        return;
      }

      const formData = {
        // ...this.formGroup.value,
        price: parseInt(this.formGroup.value.price) || 50,
        comment: this.formGroup.value.comment || '',
        pos_uuid: this.posUUID(),
        country_uuid: currentUserValue.country_uuid || '',
        province_uuid: currentUserValue.province_uuid || '',
        area_uuid: currentUserValue.area_uuid || '',
        sub_area_uuid: currentUserValue.sub_area_uuid || '',
        commune_uuid: currentUserValue.commune_uuid || '',
        asm_uuid: currentUserValue.asm_uuid || '',
        asm: currentUserValue.asm || '',
        sup_uuid: currentUserValue.sup_uuid || '',
        sup: currentUserValue.sup || '',
        dr_uuid: currentUserValue.dr_uuid || '',
        dr: currentUserValue.dr || '',
        cyclo_uuid: currentUserValue.cyclo_uuid || '',
        cyclo: currentUserValue.cyclo || '',
        user_uuid: currentUserValue.uuid,
        signature: '',
      };
      this.posformService.update(this.uuidItem(), formData).subscribe({
        next: (res) => {
          // Si un pos_uuid est fourni, mettre à jour le statut du routePlanItem à true
          const posUUIDValue = this.posUUID();
          if (posUUIDValue && posUUIDValue.trim() !== '') {
            this.routePlanItemService.update(this.routePlanItemUUID(), { status: true })
              .subscribe({
                next: () => {
                  this.getAllRoutePlans(); // Rafraîchir la liste des route plans
                },
                error: (err) => {
                  console.error('Erreur lors de la mise à jour du statut RoutePlanItem:', err);
                  // Ne pas bloquer le processus principal en cas d'erreur
                }
              });
          }

          this.logActivity.activity(
            'PosForm',
            currentUserValue.uuid,
            'updated',
            `Updated PosForm uuid: ${this.uuidItem()}`,
            currentUserValue.fullname
          ).subscribe({
            next: () => {
              this.toastr.success('Rapport modifié avec succès!', 'Succès');
              this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
              this.isLoading.set(false);
            },
            error: (err) => {
              this.isLoading.set(false);
              this.toastr.error('Erreur lors de la sauvegarde du log', 'Erreur');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires', 'Attention');
    }
  }


  /**
 * Compléter un rapport existant en ajoutant un POS
 */
  completeReport(): void {
    const posUUIDValue = this.posUUID();
    if (this.formGroup.valid && posUUIDValue) {
      this.isLoading.set(true);

      const currentUserValue = this.currentUser();
      if (!currentUserValue) {
        this.toastr.error('Utilisateur non connecté', 'Erreur');
        this.isLoading.set(false);
        return;
      }

      const formData = {
        price: parseInt(this.formGroup.value.price) || 50,
        comment: this.formGroup.value.comment || '',
        pos_uuid: posUUIDValue,
        country_uuid: currentUserValue.country_uuid || '',
        province_uuid: currentUserValue.province_uuid || '',
        area_uuid: currentUserValue.area_uuid || '',
        sub_area_uuid: currentUserValue.sub_area_uuid || '',
        commune_uuid: currentUserValue.commune_uuid || '',
        asm_uuid: currentUserValue.asm_uuid || '',
        asm: currentUserValue.asm || '',
        sup_uuid: currentUserValue.sup_uuid || '',
        sup: currentUserValue.sup || '',
        dr_uuid: currentUserValue.dr_uuid || '',
        dr: currentUserValue.dr || '',
        cyclo_uuid: currentUserValue.cyclo_uuid || '',
        cyclo: currentUserValue.cyclo || '',
        user_uuid: currentUserValue.uuid,
        signature: '',
      };
      console.log('Form Data pour la complétion du rapport:', formData);

      // Mettre à jour le rapport avec le POS sélectionné
      this.posformService.update(this.uuidItem(), formData).subscribe({
        next: (res) => {
          // ✅ Utiliser l'UUID du routePlanItem au lieu du pos_uuid
          const routePlanItemUUIDValue = this.routePlanItemUUID();
          if (routePlanItemUUIDValue) {
            console.log('Mise à jour du RoutePlanItem avec UUID:', routePlanItemUUIDValue);
            this.routePlanItemService.update(routePlanItemUUIDValue, { status: true })
              .subscribe({
                next: () => {
                  this.logActivity.activity(
                    'PosForm',
                    currentUserValue.uuid,
                    'completed',
                    `Completed PosForm uuid: ${this.uuidItem()} with POS: ${posUUIDValue}`,
                    currentUserValue.fullname
                  ).subscribe({
                    next: () => {
                      this.toastr.success('🎉 Rapport complété avec succès! Le point de vente a été assigné.', 'Succès');
                      this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
                      this.isLoading.set(false);

                      // Réinitialiser les variables
                      this.posUUID.set('');
                      this.posName.set('');
                      this.formGroup.reset();
                    },
                    error: (err) => {
                      this.isLoading.set(false);
                      this.toastr.error('Erreur lors de la sauvegarde du log', 'Erreur');
                      console.error(err);
                    }
                  });
                },
                error: (err) => {
                  console.error('❌ Erreur lors de la mise à jour du statut RoutePlanItem:', err);
                  this.toastr.warning('Rapport mis à jour mais erreur de statut du plan de route', 'Attention');

                  // Continuer même en cas d'erreur de mise à jour du statut
                  this.logActivity.activity(
                    'PosForm',
                    currentUserValue.uuid,
                    'completed',
                    `Completed PosForm uuid: ${this.uuidItem()} with POS: ${posUUIDValue}`,
                    currentUserValue.fullname
                  ).subscribe({
                    next: () => {
                      this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
                      this.isLoading.set(false);
                    },
                    error: (logErr) => {
                      this.isLoading.set(false);
                      console.error(logErr);
                    }
                  });
                }
              });
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.toastr.warning('Veuillez remplir tous les champs et sélectionner un point de vente', 'Attention');
    }
  }


  // PosFormItem Create
  onSubmitItem(): void {
    if (this.formGroupPosFormItem.valid && this.brandUUID) {
      this.isLoadingPosFormItem.set(true);

      const itemData = {
        ...this.formGroupPosFormItem.value,
        posform_uuid: this.uuidItem(),
        brand_uuid: this.brandUUID(),
        brand_name: this.brandName(),
        counter: 0  // champ requis par le backend
      };

      this.posformItemService.create(itemData).subscribe({
        next: (res) => {
          this.toastr.success('Marque ajoutée avec succès!', 'Succès');
          this.getAllPosFormItem(this.uuidItem()); // Rafraîchir la liste
          this.formGroupPosFormItem.reset();
          this.formGroupPosFormItem.patchValue({ sold: 0 });
          this.brandUUID.set('');
          this.brandName.set('');

          // Vider le champ de l'autocomplete brand
          if (this.brand_uuid && this.brand_uuid.nativeElement) {
            this.brand_uuid.nativeElement.value = '';
          }

          this.isLoadingPosFormItem.set(false);
        },
        error: (err) => {
          this.isLoadingPosFormItem.set(false);
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.toastr.warning('Veuillez remplir tous les champs et sélectionner une marque', 'Attention');
    }
  }

  // PosFormItem Delete
  deletePosFormItem(uuid: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) {
      this.posformItemService.delete(uuid).subscribe({
        next: () => {
          this.toastr.success('Marque supprimée avec succès!', 'Succès');
          this.getAllPosFormItem(this.uuidItem()); // Rafraîchir la liste
        },
        error: (err) => {
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    }
  }

  // PosFormItem
  getAllPosFormItem(uuid: string) {
    this.isLoadingPosFormItem.set(true);
    this.posformItemService.getAllById(uuid).subscribe({
      next: (res) => {
        this.dataListPosFormItem.set(res.data);
        console.log('PosFormItem List:', this.dataListPosFormItem());
        this.getAllBrand(); // Refresh brand list to exclude used brands
        this.isLoadingPosFormItem.set(false);
      }, error: (err) => {
        this.isLoadingPosFormItem.set(false);
        this.toastr.error(`${err.error.message}`, 'Oupss!');
        console.log(err);
      }
    });
  }

  // Méthode pour vérifier si le bouton "Add New PosForm" doit être activé
  canAddNewPosForm(): boolean {
    const dataList = this.dataList();
    if (!dataList || dataList.length === 0) {
      return true; // Si la liste est vide, permettre l'ajout
    }

    // Filtrer les rapports créés par l'utilisateur connecté
    const currentUserValue = this.currentUser();
    if (!currentUserValue) {
      return true; // Si pas d'utilisateur connecté, permettre l'ajout
    }
    
    const currentUserReports = dataList.filter(item => item.user_uuid === currentUserValue.uuid);

    if (currentUserReports.length === 0) {
      return true; // Si l'utilisateur n'a pas encore de rapport, permettre l'ajout
    }

    // Récupérer le dernier rapport de l'utilisateur connecté (plus récent)
    const lastUserReport = currentUserReports[0]; // Assumant que la liste est triée par date décroissante

    // Vérifier si le dernier rapport de l'utilisateur a un pos_uuid valide (non vide)
    return !!(lastUserReport.pos_uuid && typeof lastUserReport.pos_uuid === 'string' && lastUserReport.pos_uuid.trim() !== '');
  }


  delete(): void {
    const dataItemValue = this.dataItem();
    const currentUserValue = this.currentUser();
    
    if (!dataItemValue || !currentUserValue) {
      this.toastr.error('Données manquantes', 'Erreur');
      return;
    }

    this.routePlanItemService.update(dataItemValue.pos_uuid!, { status: false })
      .subscribe({
        next: () => {
          this.posformService
            .delete(this.uuidItem())
            .subscribe({
              next: () => {
                this.logActivity.activity(
                  'Posform',
                  currentUserValue.uuid,
                  'deleted',
                  `Delete posform uuid: ${this.uuidItem()}`,
                  currentUserValue.fullname
                ).subscribe({
                  next: () => {
                    this.formGroup.reset();
                    this.getAllRoutePlans(); // Refresh route plans to exclude used POS
                    this.fetchProducts(this.name(), this.territoire_uuid(), this.start_date(), this.end_date());
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
                this.isLoading.set(false);
                this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                console.log(err);
              }
            });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastr.error(`${err.error.message}`, 'Oupss!');
          console.log(err);
        }
      });
  }


  /**
   * TrackBy function pour optimiser les boucles ngFor
   */
  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByUuid(index: number, item: any): string {
    return item.uuid || index;
  }

  /**
   * Méthodes de filtrage pour la hiérarchie commerciale
   */

  /**
   * Filtrer les options ASM
   */
  filterAsmOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredAsms.set([...this.uniqueAsms()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredAsms.set(this.uniqueAsms().filter(asm =>
        asm.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les ASMs filtrés
   */
  getFilteredAsms(): string[] {
    return this.filteredAsms();
  }

  /**
   * Filtrer les options Supervisor
   */
  filterSupervisorOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredSupervisors.set([...this.uniqueSupervisors()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredSupervisors.set(this.uniqueSupervisors().filter(supervisor =>
        supervisor.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les Supervisors filtrés
   */
  getFilteredSupervisors(): string[] {
    return this.filteredSupervisors();
  }

  /**
   * Filtrer les options DR
   */
  filterDrOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredDrs.set([...this.uniqueDrs()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredDrs.set(this.uniqueDrs().filter(dr =>
        dr.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les DRs filtrés
   */
  getFilteredDrs(): string[] {
    return this.filteredDrs();
  }

  /**
   * Filtrer les options Cyclo
   */
  filterCycloOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredCyclos.set([...this.uniqueCyclos()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredCyclos.set(this.uniqueCyclos().filter(cyclo =>
        cyclo.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les Cyclos filtrés
   */
  getFilteredCyclos(): string[] {
    return this.filteredCyclos();
  }

  /**
   * Méthode de debug pour vérifier les filtres
   */
  debugFilters(): void {
    console.log('🔍 État actuel des filtres:', {
      filters: this.filters,
      search: this.search(),
      hasActiveFilters: this.hasActiveFilters(),
      activeFiltersCount: this.getActiveFiltersCount(),
      currentPage: this.current_page(),
      pageSize: this.page_size(),
      startDate: this.start_date(),
      endDate: this.end_date(),
      currentUser: this.currentUser()?.role,
      totalRecords: this.total_records()
    });
  }
}
