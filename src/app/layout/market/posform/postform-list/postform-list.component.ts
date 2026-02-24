import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, inject, signal, WritableSignal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { pairwise, filter } from 'rxjs/operators';
import { GeolocationService } from '@ng-web-apis/geolocation';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
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
import { NetworkService } from '../../../../services/network.service';
import { SyncQueueService } from '../../../../shared/services/sync-queue.service';
import { DataSyncService } from '../../../../shared/services/data-sync.service';


@Component({
  selector: 'app-postform-list',
  standalone: false,
  templateUrl: './postform-list.component.html',
  styleUrl: './postform-list.component.scss'
})
export class PostformListComponent implements OnInit, AfterViewInit {
  // Services injectés
  private readonly geolocation$ = inject(GeolocationService);
  private readonly router = inject(Router);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly posformService = inject(PosformService);
  private readonly posformItemService = inject(PosformItemService);
  private readonly brandService = inject(BrandService);
  private readonly routePlanService = inject(RouteplanService);
  private readonly routePlanItemService = inject(RouteplanItemService);
  private readonly logActivity = inject(LogsService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly networkService = inject(NetworkService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly syncQueueService = inject(SyncQueueService);
  private readonly dataSyncService = inject(DataSyncService);

  // Sync status signals
  isUploadSyncing = signal<boolean>(false);
  isDownloadSyncing = signal<boolean>(false);
  pendingUploadCount = signal<number>(0);
  downloadEntity = signal<string>('');

  // Signals
  isLoadingData = signal(false);
  isOnline = signal(navigator.onLine);
  public routes = routes;

  start_date = signal('');
  end_date = signal('');
  selectedPeriod = signal<string>('TODAY');

  dataList = signal<IPosForm[]>([]);
  total_pages = signal(0);
  page_size = signal(15);
  current_page = signal(1);
  total_records = signal(0);

  // Table
  displayedColumns: string[] = [
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
  submissionInProgress = signal(false);

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
  latitude = signal(0);
  longitude = signal(0);

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


  constructor() {
    this.geolocation$.subscribe((position) => {
      this.latitude.set(position.coords.latitude);
      this.longitude.set(position.coords.longitude);
      console.log('Latitude:', this.latitude(), 'Longitude:', this.longitude());
    });
  }


  ngAfterViewInit(): void {
    this.applyPeriod('TODAY');

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource 
        this.cdr.detectChanges(); // Trigger change detection

        const currentUserValue = this.currentUser();
        if (currentUserValue && currentUserValue.province_uuid != '') {
          this.getAllRoutePlans();
          this.getAllBrand();
        }

        this.posformService.refreshDataList$.subscribe(() => {
          const currentUser = this.currentUser();
          if (currentUser) {
            this.fetchProducts(currentUser, this.start_date(), this.end_date());
          }
        });
        if (currentUserValue) {
          this.fetchProducts(currentUserValue, this.start_date(), this.end_date());
        }

        // Gérer les transitions online → offline et offline → online
        this.networkService.getNetworkStatus().subscribe(online => {
          this.isOnline.set(online);
          // À la reconnexion, rafraîchir les données locales depuis le serveur
          if (online) {
            const user = this.currentUser();
            if (user && user.province_uuid) {
              this.getAllRoutePlans();
              this.getAllBrand();
            }
          }
        });

        this.onChanges();

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

  }

  ngOnInit() {
    this.isLoadingData.set(true);

    this.syncQueueService.isSyncing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(syncing => this.isUploadSyncing.set(syncing));

    // ✅ Rafraîchir après la fin de la sync upload (true → false)
    this.syncQueueService.isSyncing$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        pairwise(),
        filter(([prev, curr]) => prev === true && curr === false)
      )
      .subscribe(() => {
        const user = this.currentUser();
        if (user) {
          console.log('🔄 Upload sync terminé — rafraîchissement des données');
          this.fetchProducts(user, this.start_date(), this.end_date());
          this.getAllRoutePlans();
        }
      });

    this.syncQueueService.pendingCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => this.pendingUploadCount.set(count));

    this.dataSyncService.syncProgress$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(progress => {
        this.isDownloadSyncing.set(!progress.isComplete && progress.total > 0);
        this.downloadEntity.set(progress.entity);
      });

    // ✅ Rafraîchir après la fin de la sync download (isComplete devient true)
    this.dataSyncService.syncProgress$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        pairwise(),
        filter(([prev, curr]) => !prev.isComplete && curr.isComplete && curr.total > 0)
      )
      .subscribe(() => {
        const user = this.currentUser();
        if (user) {
          console.log('🔄 Download sync terminé — rafraîchissement des données');
          this.fetchProducts(user, this.start_date(), this.end_date());
          this.getAllRoutePlans();
          this.getAllBrand();
        }
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

    const currentUserValue = this.currentUser();
    if (!currentUserValue) return;

    this.routePlanService.getTodayRoutePlanOfflineFirst(currentUserValue.uuid).subscribe({
      next: (plan) => {
        this.routePlan.set(plan);
        console.log('Route Plan:', this.routePlan());
        const routePlanValue = plan;
        if (routePlanValue && routePlanValue.uuid) {
          this.routePlanItemService.getAllById(routePlanValue.uuid!).subscribe({
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
              this.routePlanItemListFilter.set(this.routePlanItemList().filter(pos =>
                pos.uuid &&
                pos.status == false &&
                !usedPosUuids.includes(pos.pos_uuid)
              ));

              this.filteredOptions.set(this.routePlanItemListFilter().filter(o => o.Pos!.name.toLowerCase().includes(filterValue)));
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

  displayFn(item: IRoutePlanItem | string | null): string {
    if (!item) return '';
    // Si c'est une chaîne (UUID ou nom brut), l'afficher directement
    if (typeof item === 'string') return item;
    // Préférer Pos.name, sinon pos_name stocké directement dans le routePlanItem (offline)
    return item.Pos?.name || (item as any).pos_name || '';
  }

  // Modifier la méthode optionSelected pour capturer l'UUID du routePlanItem
  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posUUID.set(selectedOption.pos_uuid);
    // Récupérer le nom du POS : préférer Pos.name, sinon pos_name du routePlanItem
    this.posName.set(selectedOption.Pos?.name || selectedOption.pos_name || '');
    // ✅ Capturer l'UUID du routePlanItem sélectionné
    this.routePlanItemUUID.set(selectedOption.uuid); // Ceci est l'UUID du routePlanItem, pas du POS
    // Ne pas appeler patchValue ici : le matAutocomplete stocke déjà l'objet complet
    // dans le contrôle, ce qui permet à displayFn de retourner le bon nom.
    // posUUID() signal est utilisé directement lors de la soumission.
  }

  // Pour obtenir la liste des marques visitées
  getAllBrand(): void {
    const filterValue = this.brand_uuid?.nativeElement.value.toLowerCase() ?? '';
    this.isloadBrand.set(true);

    const currentUserValue = this.currentUser();
    if (!currentUserValue) return;

    this.brandService.getBrandsOfflineFirst(currentUserValue.province_uuid).subscribe({
      next: (res) => {
        this.brandList.set(res.data);

        // Extraire les brand_uuid déjà utilisés dans les posformItems existants
        const usedBrandUuids = this.dataListPosFormItem().map(item => item.brand_uuid).filter(uuid => uuid !== null && uuid !== undefined);

        // Filtrer les brands pour exclure ceux qui sont déjà utilisés
        this.brandListFilter.set(this.brandList().filter(brand =>
          brand.uuid &&
          !usedBrandUuids.includes(brand.uuid)
        ));

        this.filteredOptionBrand.set(this.brandListFilter().filter(o => (o.name || '').toLowerCase().includes(filterValue)));
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


  /** Calcule start/end à partir d'une période prédéfinie et recharge les données */
  applyPeriod(period: string): void {
    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'TODAY':
        // start = today, end = today → déjà initialisé
        break;
      case '1W':
        start.setDate(start.getDate() - 7);
        break;
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    this.start_date.set(formatDate(start, 'yyyy-MM-dd', 'en-US'));
    this.end_date.set(formatDate(end, 'yyyy-MM-dd', 'en-US'));
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod.set(period);
    this.applyPeriod(period);
    const currentUser = this.currentUser();
    if (currentUser) {
      this.fetchProducts(currentUser, this.start_date(), this.end_date());
    }
  }

  // Méthode onChanges — conservée pour rétrocompatibilité
  onChanges(): void {}

  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1); // Adjust for 1-based page index
    this.page_size.set(event.pageSize);

    const currentUser = this.currentUser();
    if (currentUser) {
      this.fetchProducts(currentUser, this.start_date(), this.end_date());
    }
  }

  fetchProducts(currentUser: IUser, start_date: string, end_date: string): void {
    this.isLoadingData.set(true);

    const apiFilters = {
      search: this.search(),
      price: this.filters.price,
      asm: this.filters.asm,
      supervisor: this.filters.supervisor,
      dr: this.filters.dr,
      cyclo: this.filters.cyclo
    };

    // ─── LOCAL FIRST : afficher immédiatement depuis IndexedDB ───────────────────────
    this.posformService.getPaginatedOfflineFirstByUser(
      currentUser,
      this.current_page(),
      this.page_size(),
      start_date,
      end_date,
      apiFilters
    ).subscribe({
      next: (localRes) => {
        this.dataList.set(localRes.data);
        this.originalDataList.set([...localRes.data]);
        this.filteredDataList.set([...localRes.data]);
        this.total_pages.set(localRes.pagination.total_pages);
        this.total_records.set(localRes.pagination.total_records);
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

    // ─── BACKGROUND SYNC : si en ligne, rafraîchir depuis le serveur ────────────
    // Les données serveur mettent à jour le cache local, puis le tableau
    // est reréaffiché en fusionnant les entrées serveur + les pending locaux.
    if (this.isOnline()) {
      this.posformService.getPaginatedWithAdvancedFilters(
        currentUser,
        this.current_page(),
        this.page_size(),
        start_date,
        end_date,
        apiFilters
      ).subscribe({
        next: async (serverRes) => {
          if (serverRes?.data?.length) {
            await this.posformService.updateLocalCache(serverRes.data);
          }
          // Reréafficher depuis le local (synced + pending non encore envoyés)
          this.posformService.getPaginatedOfflineFirstByUser(
            currentUser,
            this.current_page(),
            this.page_size(),
            start_date,
            end_date,
            apiFilters
          ).subscribe(refreshed => {
            this.dataList.set(refreshed.data);
            this.originalDataList.set([...refreshed.data]);
            this.filteredDataList.set([...refreshed.data]);
            this.total_pages.set(refreshed.pagination.total_pages);
            this.total_records.set(refreshed.pagination.total_records);
            this.updateUniqueValues();
            this.dataSource.data = this.dataList();
          });
        },
        error: (err) => {
          // Silencieux — le local est déjà affiché
          console.warn('⚠️ Rafraîchissement serveur posforms (non bloquant):', err.message);
          this.fetchProductsFallback(currentUser, start_date, end_date);
        }
      });
    }
  }

  /**
   * Méthode de fallback utilisant les anciennes endpoints si les filtres avancés échouent
   */
  private fetchProductsFallback(currentUser: IUser, start_date: string, end_date: string): void {
    if (currentUser.role == 'Manager') {
      this.posformService.getPaginatedRangeDate2(this.current_page(), this.page_size(), this.search(),
        start_date, end_date).subscribe(res => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.filteredDataList.set([...res.data]); // Initialiser les données filtrées
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.updateUniqueValues();
          this.applyFilters();
          this.getAllRoutePlans();
          this.isLoadingData.set(false);
        });
    } else if (currentUser.role == 'ASM') {
      this.posformService.getPaginatedRangeDateByProvinceId(
        currentUser.province_uuid, this.current_page(), this.page_size(), this.search(),
        start_date, end_date).subscribe(res => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.filteredDataList.set([...res.data]); // Initialiser les données filtrées
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.updateUniqueValues();
          this.applyFilters();
          this.getAllRoutePlans();
          this.isLoadingData.set(false);
        });
    } else if (currentUser.role == 'Supervisor') {
      this.posformService.getPaginatedRangeDateByAreaId(
        currentUser.area_uuid, this.current_page(), this.page_size(), this.search(),
        start_date, end_date).subscribe(res => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.filteredDataList.set([...res.data]); // Initialiser les données filtrées
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.updateUniqueValues();
          this.applyFilters();
          this.getAllRoutePlans();
          this.isLoadingData.set(false);
        });
    } else if (currentUser.role == 'DR') {
      this.posformService.getPaginatedRangeDateBySubAreaId(
        currentUser.sub_area_uuid, this.current_page(), this.page_size(), this.search(),
        start_date, end_date).subscribe(res => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.filteredDataList.set([...res.data]); // Initialiser les données filtrées
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.updateUniqueValues();
          this.applyFilters();
          this.getAllRoutePlans();
          this.isLoadingData.set(false);
        });
    } else if (currentUser.role == 'Cyclo') {
      this.posformService.getPaginatedRangeDateByCommuneId(
        currentUser.uuid, this.current_page(), this.page_size(), this.search(),
        start_date, end_date).subscribe(res => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.filteredDataList.set([...res.data]); // Initialiser les données filtrées
          this.total_pages.set(res.pagination.total_pages);
          this.total_records.set(res.pagination.total_records);
          this.updateUniqueValues();
          this.applyFilters();
          this.getAllRoutePlans();
          this.isLoadingData.set(false);
        });
    } else {
      this.posformService.getPaginatedRangeDate2(this.current_page(), this.page_size(), this.search(),
        start_date, end_date).subscribe(res => {
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          this.filteredDataList.set([...res.data]); // In itialiser les données filtrées
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
    const currentUser = this.currentUser();
    if (currentUser) {
      this.fetchProducts(currentUser, this.start_date(), this.end_date());
    }
  }


  public sortData(sort: Sort) {
    const data = this.dataList().slice();
    if (!sort.active || sort.direction === '') {
      this.dataList.set(data);
    } else {
      this.dataList.set(data.sort((a, b) => {
        const aValue = (a as never)[sort.active];
        const bValue = (b as never)[sort.active];
        return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
      }));
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
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  /**
   * Mettre à jour les valeurs uniques pour tous les filtres
   */
  updateUniqueValues(): void {
    const data = this.originalDataList();

    // Prix
    this.uniquePrices.set([...new Set(data
      .map(item => item.price)
      .filter(price => price !== null && price !== undefined))]
      .sort((a, b) => a - b));

    // Hiérarchie commerciale (colonnes directes supportées par le backend)
    this.uniqueAsms.set([...new Set(data
      .map(item => item.asm)
      .filter(asm => asm))] as string[]);

    this.uniqueSupervisors.set([...new Set(data
      .map(item => item.sup)
      .filter(sup => sup))] as string[]);

    this.uniqueDrs.set([...new Set(data
      .map(item => item.dr)
      .filter(dr => dr))] as string[]);

    this.uniqueCyclos.set([...new Set(data
      .map(item => item.cyclo)
      .filter(cyclo => cyclo))] as string[]);

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
    const currentUser = this.currentUser();
    if (currentUser) {
      this.fetchProducts(currentUser, this.start_date(), this.end_date());
    }
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
    return this.dataList.length;
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
    return !!(this.currentUser() && posform.user_uuid === this.currentUser()!.uuid);
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

    // Mettre à jour les dates
    this.start_date.set(formatDate(startDate, 'yyyy-MM-dd', 'en-US'));
    this.end_date.set(formatDate(endDate, 'yyyy-MM-dd', 'en-US'));
    this.fetchProducts(this.currentUser()!, this.start_date(), this.end_date());
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
            <p class="summary">Total: ${this.getFilteredCount()} rapport(s) sur ${this.total_records}</p>
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

      this.filteredDataList().forEach(item => {
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
   * Prépare la suppression d'un posform : set uuidItem et dataItem directement
   * depuis l'objet ligne (évite les bugs si l'item n'est pas trouvé dans les listes filtrées).
   */
  setDeleteTarget(element: IPosForm): void {
    const uuid = element?.uuid;
    if (!uuid) {
      console.error('❌ setDeleteTarget: UUID manquant sur cet élément', element);
      this.toastr.error('Impossible de préparer la suppression : UUID introuvable.', 'Erreur');
      return;
    }
    this.uuidItem.set(uuid);
    this.dataItem.set(element);
    console.log('🗑️ Cible de suppression définie:', uuid);
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
      console.log('✅ Élément trouvé:', this.dataItem);
      this.getAllPosFormItem(uuid);

      // Pré-remplir le formulaire d'édition
      this.formGroup.patchValue({
        pos_uuid: this.dataItem()?.pos_uuid || '',
        price: this.dataItem()?.price || '',
        comment: this.dataItem()?.comment || ''
      });

      // Si c'est un rapport incomplet (sans POS), adapter l'interface
      if (!this.dataItem()?.pos_uuid || this.dataItem()!.pos_uuid!.trim() === '') {
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
        this.posUUID.set(this.dataItem()!.pos_uuid!);
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
    var body: IPosForm = {
      // uuid: uuidv4(),
      price: 100,
      comment: 'Rien à signaler',
      latitude: this.latitude(),
      longitude: this.longitude(),
      pos_uuid: '', // This will be set later
      country_uuid: this.currentUser()?.country_uuid || '',
      province_uuid: this.currentUser()?.province_uuid || '',
      area_uuid: this.currentUser()?.area_uuid || '',
      sub_area_uuid: this.currentUser()?.sub_area_uuid || '',
      commune_uuid: this.currentUser()?.commune_uuid || '',
      asm_uuid: this.currentUser()?.asm_uuid || '',
      asm: this.currentUser()?.asm || '',
      sup_uuid: this.currentUser()?.sup_uuid || '',
      sup: this.currentUser()?.sup || '',
      dr_uuid: this.currentUser()?.dr_uuid || '',
      dr: this.currentUser()?.dr || '',
      cyclo_uuid: this.currentUser()?.cyclo_uuid || '',
      cyclo: this.currentUser()?.cyclo || '',
      user_uuid: this.currentUser()!.uuid,
      signature: this.currentUser()!.fullname, // Added signature property
      // sync: true,
    };
    this.posformService.create(body).subscribe({
      next: (res) => {
        this.logActivity.activity(
          'PosForm',
          this.currentUser()!.uuid,
          'created',
          `Created Posform uuid: ${res.data.uuid!}`, // 
          this.currentUser()!.fullname
        ).subscribe({
          next: () => {
            this.formGroup.reset();
            this.dataListPosFormItem.set([]); // Réinitialiser la liste des items
            this.fetchProducts(this.currentUser()!, this.start_date(), this.end_date());
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
    // canAddNewPosForm() retourne false quand le dernier rapport n'a pas de pos_uuid.
    // Mais onSubmit() est précisément appelé pour COMPLÉTER ce rapport (update).
    // On doit donc autoriser la soumission si uuidItem correspond au dernier rapport incomplet.
    if (!this.canAddNewPosForm()) {
      const currentUserReports = this.dataList().filter(item => item.user_uuid === this.currentUser()!.uuid);
      const lastReport = currentUserReports[0];
      const isCompletingLastIncomplete = lastReport &&
        (!lastReport.pos_uuid || lastReport.pos_uuid.trim() === '') &&
        this.uuidItem() === lastReport.uuid;
      if (!isCompletingLastIncomplete) {
        this.toastr.warning('Vous devez d\'abord compléter le dernier PosForm en sélectionnant un POS.', 'Attention!');
        return;
      }
    }

    if (this.formGroup.valid) {
      this.isLoading.set(true);

      const formData = {
        latitude: this.latitude(),
        longitude: this.longitude(),
        price: parseInt(this.formGroup.value.price) || 100,
        comment: this.formGroup.value.comment || '',
        pos_uuid: this.posUUID(),
        country_uuid: this.currentUser()?.country_uuid || '',
        province_uuid: this.currentUser()?.province_uuid || '',
        area_uuid: this.currentUser()?.area_uuid || '',
        sub_area_uuid: this.currentUser()?.sub_area_uuid || '',
        commune_uuid: this.currentUser()?.commune_uuid || '',
        asm_uuid: this.currentUser()?.asm_uuid || '',
        asm: this.currentUser()?.asm || '',
        sup_uuid: this.currentUser()?.sup_uuid || '',
        sup: this.currentUser()?.sup || '',
        dr_uuid: this.currentUser()?.dr_uuid || '',
        dr: this.currentUser()?.dr || '',
        cyclo_uuid: this.currentUser()?.cyclo_uuid || '',
        cyclo: this.currentUser()?.cyclo || '',
        user_uuid: this.currentUser()!.uuid,
        signature: this.currentUser()!.fullname,
      };
      this.posformService.update(this.uuidItem(), formData).subscribe({
        next: (res) => {
          // Si un pos_uuid est fourni, mettre à jour le statut du routePlanItem à true
          if (this.posUUID() && this.posUUID().trim() !== '') {
            this.routePlanItemService.update(this.routePlanItemUUID(), { status: true })
              .subscribe({
                next: () => {
                  console.log('Statut du RoutePlanItem mis à jour à true pour pos_uuid:', this.posUUID());
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
            this.currentUser()!.uuid,
            'updated',
            `Updated PosForm uuid: ${this.uuidItem()}`,
            this.currentUser()!.fullname
          ).subscribe({
            next: () => {
              this.toastr.success('Rapport modifié avec succès!', 'Succès');
              this.fetchProducts(this.currentUser()!, this.start_date(), this.end_date());
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
    // Même logique que onSubmit(): autoriser si on complète le dernier rapport incomplet
    if (!this.canAddNewPosForm()) {
      const currentUserReports = this.dataList().filter(item => item.user_uuid === this.currentUser()!.uuid);
      const lastReport = currentUserReports[0];
      const isCompletingLastIncomplete = lastReport &&
        (!lastReport.pos_uuid || lastReport.pos_uuid.trim() === '') &&
        this.uuidItem() === lastReport.uuid;
      if (!isCompletingLastIncomplete) {
        this.toastr.warning('Vous devez d\'abord compléter le dernier PosForm en sélectionnant un POS.', 'Attention!');
        return;
      }
    }
    if (this.formGroup.valid) {
      this.isLoading.set(true);

      const formData = {
        latitude: this.latitude(),
        longitude: this.longitude(),
        price: parseInt(this.formGroup.value.price) || 100,
        comment: this.formGroup.value.comment || '',
        pos_uuid: this.posUUID(),
        country_uuid: this.currentUser()?.country_uuid || '',
        province_uuid: this.currentUser()?.province_uuid || '',
        area_uuid: this.currentUser()?.area_uuid || '',
        sub_area_uuid: this.currentUser()?.sub_area_uuid || '',
        commune_uuid: this.currentUser()?.commune_uuid || '',
        asm_uuid: this.currentUser()?.asm_uuid || '',
        asm: this.currentUser()?.asm || '',
        sup_uuid: this.currentUser()?.sup_uuid || '',
        sup: this.currentUser()?.sup || '',
        dr_uuid: this.currentUser()?.dr_uuid || '',
        dr: this.currentUser()?.dr || '',
        cyclo_uuid: this.currentUser()?.cyclo_uuid || '',
        cyclo: this.currentUser()?.cyclo || '',
        user_uuid: this.currentUser()!.uuid,
        signature: this.currentUser()!.fullname,
      };
      this.posformService.update(this.uuidItem(), formData).subscribe({
        next: (res) => {
          // Si un pos_uuid est fourni, mettre à jour le statut du routePlanItem à true
          if (this.posUUID() && this.posUUID().trim() !== '') {
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
            this.currentUser()!.uuid,
            'updated',
            `Updated PosForm uuid: ${this.uuidItem()}`,
            this.currentUser()!.fullname
          ).subscribe({
            next: () => {
              this.toastr.success('Rapport modifié avec succès!', 'Succès');
              this.fetchProducts(this.currentUser()!, this.start_date(), this.end_date());
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
    console.log('🔄 completeReport() appelée - État:', {
      isValid: this.formGroup.valid,
      posUUID: this.posUUID(),
      uuidItem: this.uuidItem(),
      dataItem: this.dataItem(),
      isLoading: this.isLoading(),
      submissionInProgress: this.submissionInProgress()
    });

    // Éviter les soumissions multiples
    if (this.submissionInProgress()) {
      console.log('⚠️ Soumission déjà en cours, abandon');
      return;
    }

    // Ne pas vérifier canAddNewPosForm() pour la complétion - c'est un cas spécial
    if (this.formGroup.valid && this.posUUID()) {
      // Vérifier que nous sommes en mode complétion
      if (!this.dataItem() || !this.uuidItem()) {
        this.toastr.error('Erreur: Aucun rapport à compléter trouvé.', 'Erreur');
        return;
      }

      this.submissionInProgress.set(true);
      this.isLoading.set(true);

      const formData = {
        latitude: this.latitude(),
        longitude: this.longitude(),
        price: parseInt(this.formGroup.value.price) || 100,
        comment: this.formGroup.value.comment || '',
        pos_uuid: this.posUUID(),
        country_uuid: this.currentUser()?.country_uuid || '',
        province_uuid: this.currentUser()?.province_uuid || '',
        area_uuid: this.currentUser()?.area_uuid || '',
        sub_area_uuid: this.currentUser()?.sub_area_uuid || '',
        commune_uuid: this.currentUser()?.commune_uuid || '',
        asm_uuid: this.currentUser()?.asm_uuid || '',
        asm: this.currentUser()?.asm || '',
        sup_uuid: this.currentUser()?.sup_uuid || '',
        sup: this.currentUser()?.sup || '',
        dr_uuid: this.currentUser()?.dr_uuid || '',
        dr: this.currentUser()?.dr || '',
        cyclo_uuid: this.currentUser()?.cyclo_uuid || '',
        cyclo: this.currentUser()?.cyclo || '',
        user_uuid: this.currentUser()!.uuid,
        signature: this.currentUser()!.fullname,
      };
      console.log('Form Data pour la complétion du rapport:', formData);

      // Finalisation commune : log + toast + refresh + reset
      const finalize = () => {
        this.logActivity.activity(
          'PosForm',
          this.currentUser()!.uuid,
          'completed',
          `Completed PosForm uuid: ${this.uuidItem()} with POS: ${this.posUUID()}`,
          this.currentUser()!.fullname
        ).subscribe({
          next: () => {
            this.toastr.success('🎉 Rapport complété avec succès! Le point de vente a été assigné.', 'Succès');
            this.fetchProducts(this.currentUser()!, this.start_date(), this.end_date());
            this.isLoading.set(false);
            this.resetFormState();
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error(err);
            // Rafraîchir quand même pour refléter le changement local
            this.fetchProducts(this.currentUser()!, this.start_date(), this.end_date());
            this.resetFormState();
          }
        });
      };

      // Mettre à jour le rapport avec le POS sélectionné
      this.posformService.update(this.uuidItem(), formData).subscribe({
        next: (res) => {
          // Mettre à jour le statut du routePlanItem si disponible
          if (this.routePlanItemUUID()) {
            console.log('Mise à jour du RoutePlanItem avec UUID:', this.routePlanItemUUID());
            this.routePlanItemService.update(this.routePlanItemUUID(), { status: true })
              .subscribe({
                next: () => {
                  this.getAllRoutePlans();
                  finalize();
                },
                error: (err) => {
                  console.error('❌ Erreur lors de la mise à jour du statut RoutePlanItem:', err);
                  this.toastr.warning('Rapport mis à jour mais erreur de statut du plan de route', 'Attention');
                  finalize();
                }
              });
          } else {
            // Pas de routePlanItem (POS local sans plan de route) — finaliser directement
            finalize();
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.submissionInProgress.set(false);
          this.toastr.error(`Erreur: ${err.error?.message || err.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.submissionInProgress.set(false);
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
          // Rafraîchir le tableau principal (le décompte de marques a changé)
          const currentUser = this.currentUser();
          if (currentUser) {
            this.fetchProducts(currentUser, this.start_date(), this.end_date());
          }
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
          this.getAllPosFormItem(this.uuidItem()); // Rafraîchir la liste des items
          // Rafraîchir le tableau principal (le décompte de marques peut avoir changé)
          const currentUser = this.currentUser();
          if (currentUser) {
            this.fetchProducts(currentUser, this.start_date(), this.end_date());
          }
        },
        error: (err) => {
          this.toastr.error(`Erreur: ${err.error?.message || err.message}`, 'Erreur');
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
    if (!this.dataList() || this.dataList().length === 0) {
      return true; // Si la liste est vide, permettre l'ajout
    }

    // Filtrer les rapports créés par l'utilisateur connecté
    const currentUserReports = this.dataList().filter(item => item.user_uuid === this.currentUser()!.uuid);

    if (currentUserReports.length === 0) {
      return true; // Si l'utilisateur n'a pas encore de rapport, permettre l'ajout
    }

    // Récupérer le dernier rapport de l'utilisateur connecté (plus récent)
    const lastUserReport = currentUserReports[0]; // Assumant que la liste est triée par date décroissante

    // Vérifier si le dernier rapport de l'utilisateur a un pos_uuid valide (non vide)
    return !!(lastUserReport.pos_uuid && typeof lastUserReport.pos_uuid === 'string' && lastUserReport.pos_uuid.trim() !== '');
  }

  /**
   * Réinitialise complètement l'état du formulaire après une soumission réussie
   */
  resetFormState(): void {
    // Réinitialiser les variables liées au POS
    this.posUUID.set('');
    this.posName.set('');
    this.routePlanItemUUID.set('');

    // Réinitialiser les variables liées aux marques
    this.brandUUID.set('');
    this.brandName.set('');
    this.dataListPosFormItem.set([]);

    // Réinitialiser les variables de l'item sélectionné
    this.dataItem.set(null);
    this.uuidItem.set('');

    // Réinitialiser les variables d'état
    this.isCompletingReport.set(false);
    this.submissionInProgress.set(false);

    // Réinitialiser le formulaire
    this.formGroup.reset();
    this.formGroupPosFormItem.reset();

    // Forcer la mise à jour de la vue
    this.cdr.detectChanges();

    console.log('État du formulaire réinitialisé');
  }

  /**
   * Détermine si nous sommes en mode complétion d'un rapport existant
   */
  isCompletionMode(): boolean {
    // Mode complétion si la variable interne l'indique ou si les conditions sont remplies
    return this.isCompletingReport() ||
      !!(this.dataItem() &&
        this.uuidItem() &&
        this.uuidItem().trim() !== '' &&
        (!this.dataItem()?.pos_uuid || this.dataItem()!.pos_uuid!.trim() === ''));
  }


  delete(): void {
    const dataItem = this.dataItem();
    const currentUser = this.currentUser();
    if (!dataItem || !currentUser) return;

    const uuid = dataItem.uuid || this.uuidItem();
    if (!uuid || uuid.trim() === '') {
      console.error('❌ delete() appelé sans UUID valide');
      this.toastr.error('UUID manquant, impossible de supprimer.', 'Erreur');
      return;
    }

    // Trouver le routePlanItem correspondant au pos_uuid du posform supprimé
    // pour réinitialiser son statut à false (POS à nouveau disponible)
    const matchingRPItem = this.routePlanItemList().find(
      item => item.pos_uuid === dataItem.pos_uuid
    );

    const doDelete = () => {
      this.posformService
        .delete(uuid)
        .subscribe({
          next: () => {
            // Mettre à jour l'UI immédiatement, sans attendre le log (qui peut échouer offline)
            this.formGroup.reset();
            this.getAllRoutePlans();
            this.fetchProducts(currentUser, this.start_date(), this.end_date());
            this.toastr.info('Supprimé avec succès!', 'Success!');
            this.isLoading.set(false);

            // Log en arrière-plan (fire-and-forget : ne bloque pas si offline)
            this.logActivity.activity(
              'Posform',
              currentUser.uuid,
              'deleted',
              `Delete posform uuid: ${uuid}`,
              currentUser.fullname
            ).subscribe({
              error: (err) => console.warn('⚠️ Log activité non envoyé (offline ?):', err.message)
            });
          },
          error: err => {
            this.isLoading.set(false);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
    };

    if (matchingRPItem?.uuid) {
      // Réinitialiser le statut du RoutePlanItem (POS à nouveau disponible) avant suppression
      this.routePlanItemService.update(matchingRPItem.uuid, { status: false })
        .subscribe({
          next: () => doDelete(),
          error: () => {
            // Ne pas bloquer la suppression même si la réinitialisation du statut échoue
            console.warn('⚠️ Impossible de réinitialiser le statut RoutePlanItem — suppression quand même');
            doDelete();
          }
        });
    } else {
      doDelete();
    }
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

}
