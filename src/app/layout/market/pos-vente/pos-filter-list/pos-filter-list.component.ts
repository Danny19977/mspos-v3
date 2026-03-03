import { ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ToastrService } from 'ngx-toastr';
import { IPos } from '../models/pos.model';
import { PosVenteService } from '../pos-vente.service';
import { routes } from '../../../../shared/routes/routes';
import { IUser } from '../../../management/user/models/user.model';
import { AuthService } from '../../../../auth/auth.service';
import { CountryService } from '../../../territories/country/country.service';
import { ProvinceService } from '../../../territories/province/province.service';
import { AreaService } from '../../../territories/areas/area.service';
import { SubareaService } from '../../../territories/subarea/subarea.service';
import { LogsService } from '../../../management/user-logs/logs.service';
import { IPosForm } from '../../posform/models/posform.model'; 
import { CommuneService } from '../../../territories/commune/commune.service';
import { ReloadComponent } from '../../../../shared/components/reload/reload.component';
import { CollapseHeaderComponent } from '../../../../shared/common/collapse-header/collapse-header.component';
import { NetworkService } from '../../../../services/network.service';
import { SyncQueueService } from '../../../../shared/services/sync-queue.service';
import { DataSyncService } from '../../../../shared/services/data-sync.service';

@Component({
  selector: 'app-pos-filter-list',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatFormFieldModule,
    ReloadComponent,
    CollapseHeaderComponent
  ],
  templateUrl: './pos-filter-list.component.html',
  styleUrl: './pos-filter-list.component.scss'
})
export class PosFilterListComponent implements OnInit {
  // Signals
  isLoadingData = signal(false);
  isOnline = signal<boolean>(true);
  routes = signal(routes);
  dataList = signal<IPos[]>([]);
  dataListLocal = signal<IPos[]>([]);
  total_pages = signal(0);
  page_size = signal(15);
  current_page = signal(1);
  total_records = signal(0);

  displayedColumns: string[] = [
    'status',
    'postype',
    'country',
    'province',
    'area',
    'subarea',
    'commune',
    'name',
    'shop',
    'gerant',
    'quartier',
    'avenue',
    'reference',
    'telephone',
    'asm',
    'sup',
    'dr',
    'cyclo',
    'fullname',
    'posforms',
    'action'
  ];
  dataSource = new MatTableDataSource<IPos>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  search = signal('');
  showAdvancedFilters = signal(false);

  // Filtres alignés avec le backend Go
  // Params supportés : search, country, province, area, subarea, commune, agent
  filters = signal({
    country: '',
    province: '',
    area: '',
    subarea: '',
    commune: '',
    agent: ''
  });

  // Listes des valeurs uniques pour les filtres déroulants
  uniqueCountries = signal<string[]>([]);
  uniqueProvinces = signal<string[]>([]);
  uniqueAreas = signal<string[]>([]);
  uniqueSubAreas = signal<string[]>([]);
  uniqueCommunes = signal<string[]>([]);

  // Données originales et filtrées
  originalDataList = signal<IPos[]>([]);
  filteredDataList = signal<IPos[]>([]);

  // Forms  
  uuidItem = signal('');
  dataItem = signal<IPos>(null!);
  formGroup = signal<FormGroup>(null!);
  currentUser = signal<IUser>(null!);
  isLoading = signal(false);

  /** Flag pour éviter de re-télécharger tous les POS à chaque appel de fetchProducts */
  private hasDownloadedAllPos = false;

  posTypes: string[] = [
    'Gros',
    'Détail',
    'Mixte'
  ];

  name = signal('');
  territoire_uuid = signal('');
  territoire = signal<any>(null);

  // Services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private posVenteService = inject(PosVenteService);
  private countryService = inject(CountryService);
  private provinceService = inject(ProvinceService);
  private areaService = inject(AreaService);
  private subAreaService = inject(SubareaService);
  private communeService = inject(CommuneService);
  private logActivity = inject(LogsService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);
  private networkService = inject(NetworkService);
  private syncQueueService = inject(SyncQueueService);
  private dataSyncService = inject(DataSyncService);

  // Sync status signals
  isUploadSyncing = signal<boolean>(false);
  isDownloadSyncing = signal<boolean>(false);
  pendingUploadCount = signal<number>(0);
  downloadEntity = signal<string>('');


  ngOnInit() {
    this.formGroup.set(this._formBuilder.group({
      name: ['', Validators.required],
      shop: ['', Validators.required],
      postype: ['', Validators.required],
      gerant: ['', Validators.required],
      avenue: ['', Validators.required],
      quartier: ['', Validators.required],
      reference: ['', Validators.required],
      telephone: ['', Validators.required],
      // status: ['', Validators.required],
    }));

    this.syncQueueService.isSyncing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(syncing => {
        const wasUploadSyncing = this.isUploadSyncing();
        this.isUploadSyncing.set(syncing);
        // Actualiser le tableau quand la sync upload se termine
        if (wasUploadSyncing && !syncing && this.currentUser()) {
          this.fetchProducts(this.name(), this.territoire_uuid());
        }
      });

    this.syncQueueService.pendingCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => this.pendingUploadCount.set(count));

    this.dataSyncService.syncProgress$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(progress => {
        const wasDownloadSyncing = this.isDownloadSyncing();
        this.isDownloadSyncing.set(!progress.isComplete && progress.total > 0);
        this.downloadEntity.set(progress.entity);
        // Actualiser le tableau quand la sync download se termine
        if (wasDownloadSyncing && progress.isComplete && progress.total > 0 && this.currentUser()) {
          this.fetchProducts(this.name(), this.territoire_uuid());
        }
      });

    this.networkService.getNetworkStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(online => {
        const wasOffline = !this.isOnline();
        this.isOnline.set(online);
        if (wasOffline && online && this.currentUser()) {
          this.fetchProducts(this.name(), this.territoire_uuid());
        }
      });

    this.isLoadingData.set(true);
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.name.set(params['name']);
      this.territoire_uuid.set(params['uuid']);
      this.authService.user().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.cdr.detectChanges();

          this.posVenteService.refreshDataList$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.fetchProducts(this.name(), this.territoire_uuid());
          });
          this.fetchProducts(this.name(), this.territoire_uuid());
        },
        error: (error) => {
          this.isLoadingData.set(false);
          this.router.navigate(['/auth/login']);
          console.log(error);
        }
      });

    });
  }

  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1);
    this.page_size.set(event.pageSize);

    this.fetchProducts(this.name(), this.territoire_uuid());
  }




  fetchProducts(name: string, territoire_uuid: string) {
    // Charger d'abord les données locales en attente de synchronisation
    const userId = this.currentUser()?.uuid ?? '';
    this.posVenteService.getLocalPendingPos(userId).then(localPending => {
      // Enrichir chaque enregistrement local avec les objets territoire du currentUser
      // (les records de l'IndexedDB n'ont que les UUIDs, pas les relations imbriquées)
      const user = this.currentUser();
      const enrichedLocal: IPos[] = localPending.map(pos => ({
        ...pos,
        sync_status: 'pending' as const,
        Country: pos.Country || user?.Country || undefined,
        Province: pos.Province || user?.Province || undefined,
        Area: pos.Area || user?.Area || undefined,
        SubArea: pos.SubArea || user?.SubArea || undefined,
        Commune: pos.Commune || user?.Commune || undefined,
        country_name: pos.country_name || user?.Country?.name,
        province_name: pos.province_name || user?.Province?.name,
        area_name: pos.area_name || user?.Area?.name,
        subarea_name: pos.subarea_name || user?.SubArea?.name,
        commune_name: pos.commune_name || user?.Commune?.name,
      }));
      this.dataListLocal.set(enrichedLocal);

      // Si hors ligne : afficher uniquement les données locales
      if (!this.isOnline()) {
        this.dataSource.data = enrichedLocal;
        this.total_records.set(enrichedLocal.length);
        this.isLoadingData.set(false);
        return;
      }

      // Télécharger les POS du territoire vers le cache local uniquement pour les rôles terrain
      // (ASM, Supervisor, DR, Cyclo) — pas pour Manager/Support/country (trop de données, risque de conflits)
      const isFieldRole = ['ASM', 'Supervisor', 'DR', 'Cyclo', 'province', 'area', 'subarea', 'commune'].includes(name);
      if (isFieldRole && !this.hasDownloadedAllPos) {
        this.hasDownloadedAllPos = true;
        this.posVenteService.downloadAllCloudPosByTerritoryToLocal(name, territoire_uuid);
      }

      const mergeWithLocal = (serverData: IPos[]) => {
        const filtered = serverData.filter(s =>
          !enrichedLocal.some(l => l.uuid === s.uuid || (l as any).temp_id === s.uuid)
        );
        return [...enrichedLocal, ...filtered];
      };

      if (name == "country" || name == 'Manager' || name == 'Support') {
        this.countryService.get(this.territoire_uuid()).subscribe(res => {
          this.territoire.set(res.data);
          const filterParams = { search: this.search(), ...this.filters() };
          this.posVenteService.getPaginatedWithAdvancedFilters2(
            name, territoire_uuid, this.current_page(), this.page_size(), filterParams
          ).subscribe({
            next: (res) => {
              this.dataList.set(res.data);
              this.originalDataList.set([...res.data]);
              this.total_pages.set(res.pagination.total_pages);
              this.total_records.set(res.pagination.total_records);
              this.dataSource.data = mergeWithLocal(res.data);
              this.updateUniqueValues();
              this.isLoadingData.set(false);
            },
            error: (err) => {
              console.log('Erreur lors de la récupération des données:', err);
              this.fetchProductsOldMethod(name, territoire_uuid);
            }
          });
        });
      } else if (name == 'province' || name == 'ASM') {
        this.provinceService.get(this.territoire_uuid()).subscribe(res => {
          this.territoire.set(res.data);
          const filterParams = { search: this.search(), ...this.filters() };
          this.posVenteService.getPaginatedWithAdvancedFilters2(
            name, territoire_uuid, this.current_page(), this.page_size(), filterParams
          ).subscribe({
            next: (res) => {
              this.dataList.set(res.data);
              this.originalDataList.set([...res.data]);
              this.total_pages.set(res.pagination.total_pages);
              this.total_records.set(res.pagination.total_records);
              this.dataSource.data = mergeWithLocal(res.data);
              this.updateUniqueValues();
              this.isLoadingData.set(false);
            },
            error: (err) => {
              console.log('Erreur lors de la récupération des données:', err);
              this.fetchProductsOldMethod(name, territoire_uuid);
            }
          });
        });
      } else if (name == 'area' || name == 'Supervisor') {
        this.areaService.get(this.territoire_uuid()).subscribe(res => {
          this.territoire.set(res.data);
          const filterParams = { search: this.search(), ...this.filters() };
          this.posVenteService.getPaginatedWithAdvancedFilters2(
            name, territoire_uuid, this.current_page(), this.page_size(), filterParams
          ).subscribe({
            next: (res) => {
              this.dataList.set(res.data);
              this.originalDataList.set([...res.data]);
              this.total_pages.set(res.pagination.total_pages);
              this.total_records.set(res.pagination.total_records);
              this.dataSource.data = mergeWithLocal(res.data);
              this.updateUniqueValues();
              this.isLoadingData.set(false);
            },
            error: (err) => {
              console.log('Erreur lors de la récupération des données:', err);
              this.fetchProductsOldMethod(name, territoire_uuid);
            }
          });
        });
      } else if (name == 'subarea' || name == 'DR') {
        this.subAreaService.get(this.territoire_uuid()).subscribe(res => {
          this.territoire.set(res.data);
          const filterParams = { search: this.search(), ...this.filters() };
          this.posVenteService.getPaginatedWithAdvancedFilters2(
            name, territoire_uuid, this.current_page(), this.page_size(), filterParams
          ).subscribe({
            next: (res) => {
              this.dataList.set(res.data);
              this.originalDataList.set([...res.data]);
              this.total_pages.set(res.pagination.total_pages);
              this.total_records.set(res.pagination.total_records);
              this.dataSource.data = mergeWithLocal(res.data);
              this.updateUniqueValues();
              this.isLoadingData.set(false);
            },
            error: (err) => {
              console.log('Erreur lors de la récupération des données:', err);
              this.fetchProductsOldMethod(name, territoire_uuid);
            }
          });
        });
      } else if (name == 'commune' || name == 'Cyclo') {
        this.communeService.get(this.territoire_uuid()).subscribe(res => {
          this.territoire.set(res.data);
          const filterParams = { search: this.search(), ...this.filters() };
          this.posVenteService.getPaginatedWithAdvancedFilters2(
            name, territoire_uuid, this.current_page(), this.page_size(), filterParams
          ).subscribe({
            next: (res) => {
              this.dataList.set(res.data);
              this.originalDataList.set([...res.data]);
              this.total_pages.set(res.pagination.total_pages);
              this.total_records.set(res.pagination.total_records);
              this.dataSource.data = mergeWithLocal(res.data);
              this.updateUniqueValues();
              this.isLoadingData.set(false);
            },
            error: (err) => {
              console.log('Erreur lors de la récupération des données:', err);
              this.fetchProductsOldMethod(name, territoire_uuid);
            }
          });
        });
      }
    });
  }

  // Méthode de fallback avec l'ancienne logique
  fetchProductsOldMethod(name: string, territoire_uuid: string) {
    const applyResult = (res: any) => {
      this.dataList.set(res.data);
      this.originalDataList.set([...res.data]);
      this.total_pages.set(res.pagination?.total_pages ?? 1);
      this.total_records.set(res.pagination?.total_records ?? res.data?.length ?? 0);
      this.dataSource.data = this.dataList();
      this.updateUniqueValues();
      this.isLoadingData.set(false);
    };

    if (name == 'country' || name == 'Manager' || name == 'Support') {
      this.isLoadingData.set(true);
      this.countryService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        // Country → /all/paginate/country/:country_uuid
        this.posVenteService.getPaginatedByCountryUUId(territoire_uuid, this.current_page(), this.page_size(), this.search()).subscribe(applyResult);
      });
    } else if (name == 'province' || name == 'ASM') {
      this.isLoadingData.set(true);
      this.provinceService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        // Province → /all/paginate/province/:province_uuid
        this.posVenteService.getPaginatedByProvinceId(territoire_uuid, this.current_page(), this.page_size(), this.search()).subscribe(applyResult);
      });
    } else if (name == 'area' || name == 'Supervisor') {
      this.isLoadingData.set(true);
      this.areaService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        // Area → /all/paginate/area/:area_uuid
        this.posVenteService.getPaginatedByAreaId(territoire_uuid, this.current_page(), this.page_size(), this.search()).subscribe(applyResult);
      });
    } else if (name == 'subarea' || name == 'DR') {
      this.isLoadingData.set(true);
      this.subAreaService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        // SubArea → /all/paginate/subarea/:sub_area_uuid
        this.posVenteService.getPaginatedBySubAreaId(territoire_uuid, this.current_page(), this.page_size(), this.search()).subscribe(applyResult);
      });
    } else if (name == 'commune' || name == 'Cyclo') {
      this.isLoadingData.set(true);
      this.communeService.get(territoire_uuid).subscribe(res => {
        this.territoire.set(res.data);
        // Commune → /all/paginate/commune-filter/:commune_uuid
        this.posVenteService.getPaginatedByCommuneFilterId(territoire_uuid, this.current_page(), this.page_size(), this.search()).subscribe(applyResult);
      });
    }
  }


  onSearchChange(search: string) {
    this.search.set(search);
    this.fetchProducts(this.name(), this.territoire_uuid());
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
    // Valeurs géographiques pour les filtres déroulants
    this.uniqueCountries.set([...new Set(this.originalDataList()
      .map(item => item.Country?.name || item.country_name)
      .filter(name => name))] as string[]);

    this.uniqueProvinces.set([...new Set(this.originalDataList()
      .map(item => item.Province?.name || item.province_name)
      .filter(name => name))] as string[]);

    this.uniqueAreas.set([...new Set(this.originalDataList()
      .map(item => item.Area?.name || item.area_name)
      .filter(name => name))] as string[]);

    this.uniqueSubAreas.set([...new Set(this.originalDataList()
      .map(item => item.SubArea?.name || item.subarea_name)
      .filter(name => name))] as string[]);

    this.uniqueCommunes.set([...new Set(this.originalDataList()
      .map(item => item.Commune?.name || item.commune_name)
      .filter(name => name))] as string[]);
  }

  /**
   * Appliquer tous les filtres
   */
  applyFilters(): void {
    this.current_page.set(1); // Reset à la première page lors de l'application de filtres
    this.fetchProducts(this.name(), this.territoire_uuid());
  }

  /**
   * Effacer tous les filtres
   */
  clearAllFilters(): void {
    this.filters.set({
      country: '',
      province: '',
      area: '',
      subarea: '',
      commune: '',
      agent: ''
    });

    this.search.set('');
    this.applyFilters();
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

  findValue(value: string) {
    this.uuidItem.set(value);

    // Pour les enregistrements locaux (sync_status === 'pending'), l'UUID est un temp_id
    // qui n'existe pas encore sur le serveur. On les charge directement depuis le dataSource.
    const localRecord = this.dataSource.data.find(
      p => p.uuid === value && p.sync_status === 'pending'
    );

    if (localRecord) {
      this.dataItem.set(localRecord);
      this.formGroup().patchValue({
        name: localRecord.name,
        shop: localRecord.shop,
        postype: localRecord.postype,
        gerant: localRecord.gerant,
        avenue: localRecord.avenue,
        quartier: localRecord.quartier,
        reference: localRecord.reference,
        telephone: localRecord.telephone,
        country_uuid: localRecord.country_uuid,
        province_uuid: localRecord.province_uuid,
        area_uuid: localRecord.area_uuid,
        sub_area_uuid: localRecord.sub_area_uuid,
        commune_uuid: localRecord.commune_uuid,
        user_uuid: localRecord.user_uuid,
        asm_uuid: localRecord.asm_uuid,
        sup_uuid: localRecord.sup_uuid,
        dr_uuid: localRecord.dr_uuid,
        cyclo_uuid: localRecord.cyclo_uuid,
        status: localRecord.status,
      });
      return;
    }

    this.posVenteService.get(this.uuidItem()).subscribe(item => {
      this.dataItem.set(item.data);
      this.formGroup().patchValue({
        name: this.dataItem().name,
        shop: this.dataItem().shop,
        postype: this.dataItem().postype,
        gerant: this.dataItem().gerant,
        avenue: this.dataItem().avenue,
        quartier: this.dataItem().quartier,
        reference: this.dataItem().reference,
        telephone: this.dataItem().telephone,
        country_uuid: this.dataItem().country_uuid,
        province_uuid: this.dataItem().province_uuid,
        area_uuid: this.dataItem().area_uuid,
        sub_area_uuid: this.dataItem().sub_area_uuid,
        commune_uuid: this.dataItem().commune_uuid,
        user_uuid: this.dataItem().user_uuid,
        asm_uuid: this.dataItem().asm_uuid,
        sup_uuid: this.dataItem().sup_uuid,
        dr_uuid: this.dataItem().dr_uuid,
        cyclo_uuid: this.dataItem().cyclo_uuid,
        status: this.dataItem().status,
      });
    });
  }

  onSubmit() {
    try {
      if (this.formGroup().valid) {
        this.isLoading.set(true);

        var body: IPos = {
          name: this.formGroup().value.name,
          shop: this.formGroup().value.shop,
          postype: this.formGroup().value.postype,
          gerant: this.formGroup().value.gerant,
          avenue: this.formGroup().value.avenue,
          quartier: this.formGroup().value.quartier,
          reference: this.formGroup().value.reference,
          telephone: this.formGroup().value.telephone,
          country_uuid: this.currentUser().country_uuid,
          country_name: this.currentUser().Country?.name,
          province_uuid: this.currentUser().province_uuid,
          province_name: this.currentUser().Province?.name,
          area_uuid: this.currentUser().area_uuid,
          area_name: this.currentUser().Area?.name,
          sub_area_uuid: this.currentUser().sub_area_uuid,
          subarea_name: this.currentUser().SubArea?.name,
          commune_uuid: this.currentUser().commune_uuid,
          commune_name: this.currentUser().Commune?.name,
          asm_uuid: this.currentUser().asm_uuid,
          asm: this.currentUser().asm,
          sup_uuid: this.currentUser().sup_uuid,
          sup: this.currentUser().sup,
          dr_uuid: this.currentUser().dr_uuid,
          dr: this.currentUser().dr,
          cyclo_uuid: this.currentUser().cyclo_uuid,
          cyclo: this.currentUser().cyclo,
          user_uuid: this.currentUser().uuid,
          status: true, // le status change une fois que le pos est synchronisé
          signature: this.currentUser().fullname,
          sync: false, // Indique que le POS n'est pas encore synchronisé 
        };
        this.posVenteService.create(body)
          .subscribe({
            next: (res) => {
              this.logActivity.activity(
                'POS',
                this.currentUser().uuid,
                'created',
                `Created Pos uuid: ${res.data.uuid}`,
                this.currentUser().fullname
              ).subscribe({
                next: () => {
                  this.formGroup().reset();
                  this.toastr.success('Ajouter avec succès!', 'Success!');
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
      }
    } catch (error) {
      this.isLoading.set(false);
      console.log(error);
    }
  }

  onSubmitUpdate() {
    try {
      this.isLoading.set(true);
      var body: IPos = {
        name: this.formGroup().value.name,
        shop: this.formGroup().value.shop,
        postype: this.formGroup().value.postype,
        gerant: this.formGroup().value.gerant,
        avenue: this.formGroup().value.avenue,
        quartier: this.formGroup().value.quartier,
        reference: this.formGroup().value.reference,
        telephone: this.formGroup().value.telephone,
        country_uuid: this.currentUser().country_uuid,
        country_name: this.currentUser().Country?.name,
        province_uuid: this.currentUser().province_uuid,
        province_name: this.currentUser().Province?.name,
        area_uuid: this.currentUser().area_uuid,
        area_name: this.currentUser().Area?.name,
        sub_area_uuid: this.currentUser().sub_area_uuid,
        subarea_name: this.currentUser().SubArea?.name,
        commune_uuid: this.currentUser().commune_uuid,
        commune_name: this.currentUser().Commune?.name,
        asm_uuid: this.currentUser().asm_uuid,
        asm: this.currentUser().asm,
        sup_uuid: this.currentUser().sup_uuid,
        sup: this.currentUser().sup,
        dr_uuid: this.currentUser().dr_uuid,
        dr: this.currentUser().dr,
        cyclo_uuid: this.currentUser().cyclo_uuid,
        cyclo: this.currentUser().cyclo,
        user_uuid: this.currentUser().uuid,
        status: true, // le status change une fois que le pos est synchronisé
        signature: this.currentUser().fullname,
        sync: false // Indique que le POS n'est pas encore synchronisé,
      };
      this.posVenteService.update(this.uuidItem(), body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'POS',
              this.currentUser().uuid,
              'updated',
              `Updated Pos uuid: ${res.data.uuid}`,
              this.currentUser().fullname
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

  delete(): void {
    this.posVenteService
      .delete(this.uuidItem())
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'POS',
            this.currentUser().uuid,
            'deleted',
            `Delete pos uuid: ${this.uuidItem()}`,
            this.currentUser().fullname
          ).subscribe({
            next: () => {
              this.formGroup().reset();
              this.toastr.info('Supprimé avec succès!', 'Success!');
              this.fetchProducts(this.name(), this.territoire_uuid());
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

  // Méthode helper pour mettre à jour les filtres
  updateFilter(key: string, value: any): void {
    this.filters.update(f => ({...f, [key]: value}));
  }

  updateFilterAndApply(key: string, value: any): void {
    this.updateFilter(key, value);
    this.applyFilters();
  }
}

