import { ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { routes } from '../../../../shared/routes/routes';
import { AuthService } from '../../../../auth/auth.service';
import { IPos } from '../models/pos.model';
import { PosVenteService } from '../pos-vente.service';
import { LogsService } from '../../../management/user-logs/logs.service';
import { IUser } from '../../../management/user/models/user.model';
import { IPosForm } from '../../posform/models/posform.model';
import { ReloadComponent } from '../../../../shared/components/reload/reload.component';
import { CollapseHeaderComponent } from '../../../../shared/common/collapse-header/collapse-header.component';
import { NetworkService } from '../../../../services/network.service';
import { SyncQueueService } from '../../../../shared/services/sync-queue.service';
import { DataSyncService } from '../../../../shared/services/data-sync.service';

@Component({
  selector: 'app-pos-vente-list',
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
  templateUrl: './pos-vente-list.component.html',
  styleUrl: './pos-vente-list.component.scss'
})
export class PosVenteListComponent implements OnInit {
  isLoadingData = signal<boolean>(false);
  isOnline = signal<boolean>(true);

  public routes = routes;

  // Table 
  dataList = signal<IPos[]>([]);
  dataListLocal = signal<IPos[]>([]);

  total_pages = signal<number>(0);
  page_size = signal<number>(15);
  current_page = signal<number>(1);
  total_records = signal<number>(0);

  // Table
  displayedColumns = signal<string[]>([
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
  ]);
  dataSource = new MatTableDataSource<IPos>([]);

  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  public search = signal<string>('');

  // Propriétés pour les filtres avancés
  showAdvancedFilters = signal<boolean>(false);

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
  uuidItem = signal<string>('');
  dataItem = signal<IPos>(null!);

  formGroup = signal<FormGroup>(null!);
  currentUser = signal<IUser>(null!);
  isLoading = signal<boolean>(false);

  /** Flag pour éviter de re-télécharger tous les POS à chaque appel de fetchProducts */
  private hasDownloadedAllPos = false;

  posTypes = signal<string[]>([
    'Gros',
    'Détail',
    'Mixte'
  ]);

  // Services injectés
  private router = inject(Router);
  private _formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private posVenteService = inject(PosVenteService);
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
    this.isLoadingData.set(true);
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


    // Subscribe to upload sync status
    this.syncQueueService.isSyncing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(syncing => this.isUploadSyncing.set(syncing));

    this.syncQueueService.pendingCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => this.pendingUploadCount.set(count));

    // Subscribe to download sync status
    this.dataSyncService.syncProgress$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(progress => {
        this.isDownloadSyncing.set(!progress.isComplete && progress.total > 0);
        this.downloadEntity.set(progress.entity);
      });

    this.networkService.getNetworkStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(online => {
        const wasOffline = !this.isOnline();
        this.isOnline.set(online);
        if (wasOffline && online && this.currentUser()) {
          this.fetchProducts(this.currentUser());
        }
      });

    this.authService.user()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.dataSource.paginator = this.paginator() ?? null; // Bind paginator to dataSource
        this.dataSource.sort = this.sort() ?? null; // Bind sort to dataSource
        this.cdr.detectChanges(); // Trigger change detection

        this.posVenteService.refreshDataList$
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
          this.fetchProducts(this.currentUser());
        });
        this.fetchProducts(this.currentUser());
      },
      error: (error) => {
        this.isLoadingData.set(false);
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });

  }

  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1); // Adjust for 1-based page index
    this.page_size.set(event.pageSize);

    this.fetchProducts(this.currentUser());
  }




  fetchProducts(currentUser: IUser) {
    // Charger d'abord les données locales en attente de synchronisation
    this.posVenteService.getLocalPendingPos(currentUser.uuid).then(localPending => {
      // Enrichir chaque enregistrement local avec les objets territoire du currentUser
      // (les records de l'IndexedDB n'ont que les UUIDs, pas les relations imbriquées)
      const user = this.currentUser();
      const enrichedLocal: IPos[] = localPending.map(pos => ({
        ...pos,
        sync_status: 'pending' as const,
        Country: pos.Country || user.Country || undefined,
        Province: pos.Province || user.Province || undefined,
        Area: pos.Area || user.Area || undefined,
        SubArea: pos.SubArea || user.SubArea || undefined,
        Commune: pos.Commune || user.Commune || undefined,
      }));
      this.dataListLocal.set(enrichedLocal);

      // Si hors ligne : afficher uniquement les données locales
      if (!this.isOnline()) {
        this.dataSource.data = enrichedLocal;
        this.total_records.set(enrichedLocal.length);
        this.isLoadingData.set(false);
        return;
      }

      // Télécharger l'intégralité des POS autorisés vers le cache local (une seule fois par session)
      if (!this.hasDownloadedAllPos) {
        this.hasDownloadedAllPos = true;
        this.posVenteService.downloadAllCloudPosToLocal(currentUser);
      }

      // En ligne : récupérer les données serveur et les fusionner au-dessous des locales
      const filterParams = {
        search: this.search(),
        ...this.filters()
      };

      this.posVenteService.getPaginatedWithAdvancedFilters(
        currentUser,
        this.current_page(),
        this.page_size(),
        filterParams
      ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // Exclure du serveur les enregistrements qui existent déjà en local (évite les doublons)
          const serverData = (res.data as IPos[]).filter(s =>
            !enrichedLocal.some(l => l.uuid === s.uuid || (l as any).temp_id === s.uuid)
          );
          const merged = [...enrichedLocal, ...serverData];
          this.dataList.set(res.data);
          this.originalDataList.set([...res.data]);
          const pagination = res.pagination;
          this.total_pages.set(pagination?.total_pages ?? res.total_pages ?? 1);
          const serverTotal = pagination?.total_records ?? res.total ?? res.total_records ?? 0;
          this.total_records.set(serverTotal + enrichedLocal.length);
          this.dataSource.data = merged;
          this.updateUniqueValues();
          this.isLoadingData.set(false);
        },
        error: (err) => {
          console.log('Erreur lors de la récupération des données:', err);
          this.fetchProductsOldMethod(currentUser);
        }
      });
    });
  }

  // Méthode de fallback avec l'ancienne logique
  fetchProductsOldMethod(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.posVenteService.getPaginated2(this.current_page(), this.page_size(), this.search(),
      ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource.data = this.dataList();
        this.updateUniqueValues();
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'ASM') {
      this.posVenteService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page(), this.page_size(), this.search(),

      ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]);
        console.log("dataList", this.dataList());
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource.data = this.dataList();
        this.updateUniqueValues();
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'Supervisor') {
      this.posVenteService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page(), this.page_size(), this.search(),

      ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource.data = this.dataList();
        this.updateUniqueValues();
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'DR') {
      console.log("sub_area_uuid", currentUser.dr_uuid);
      this.posVenteService.getPaginatedBySubAreaId(currentUser.sub_area_uuid, this.current_page(), this.page_size(), this.search(),

      ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource.data = this.dataList();
        this.updateUniqueValues();
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'Cyclo') {
      this.posVenteService.getPaginatedByCommuneId(currentUser.uuid, this.current_page(), this.page_size(), this.search(),
      ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource.data = this.dataList();
        this.updateUniqueValues();
        this.isLoadingData.set(false);
      });
    } else {
      this.posVenteService.getPaginated2(this.current_page(), this.page_size(), this.search(),
      ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]);
        console.log("dataList", this.dataList());
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource.data = this.dataList();
        this.updateUniqueValues();
        this.isLoadingData.set(false);
      });
    }
  }


  onSearchChange(search: string) {
    this.search.set(search);
    this.fetchProducts(this.currentUser());
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
      .map(item => item.Country?.name)
      .filter(name => name))] as string[]);

    this.uniqueProvinces.set([...new Set(this.originalDataList()
      .map(item => item.Province?.name)
      .filter(name => name))] as string[]);

    this.uniqueAreas.set([...new Set(this.originalDataList()
      .map(item => item.Area?.name)
      .filter(name => name))] as string[]);

    this.uniqueSubAreas.set([...new Set(this.originalDataList()
      .map(item => item.SubArea?.name)
      .filter(name => name))] as string[]);

    this.uniqueCommunes.set([...new Set(this.originalDataList()
      .map(item => item.Commune?.name)
      .filter(name => name))] as string[]);
  }

  /**
   * Appliquer tous les filtres
   */
  applyFilters(): void {
    this.current_page.set(1); // Reset à la première page lors de l'application de filtres
    this.fetchProducts(this.currentUser());
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

    this.posVenteService.get(this.uuidItem())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(item => {
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
          province_uuid: this.currentUser().province_uuid,
          area_uuid: this.currentUser().area_uuid,
          sub_area_uuid: this.currentUser().sub_area_uuid,
          commune_uuid: this.currentUser().commune_uuid,
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
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              this.logActivity.activity(
                'POS',
                this.currentUser().uuid,
                'created',
                `Created Pos uuid: ${res.data.uuid}`,
                this.currentUser().fullname
              ).pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.formGroup().reset();
                  this.toastr.success('Ajouter avec succès!', 'Success!');
                  this.fetchProducts(this.currentUser());
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
        province_uuid: this.currentUser().province_uuid,
        area_uuid: this.currentUser().area_uuid,
        sub_area_uuid: this.currentUser().sub_area_uuid,
        commune_uuid: this.currentUser().commune_uuid,
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
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'POS',
              this.currentUser().uuid,
              'updated',
              `Updated Pos uuid: ${res.data.uuid}`,
              this.currentUser().fullname
            ).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.formGroup().reset();
                this.toastr.success('Modification enregistré!', 'Success!');
                this.fetchProducts(this.currentUser());
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'POS',
            this.currentUser().uuid,
            'deleted',
            `Delete pos uuid: ${this.uuidItem()}`,
            this.currentUser().fullname
          ).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.formGroup().reset();
              this.toastr.info('Supprimé avec succès!', 'Success!');
              this.fetchProducts(this.currentUser());
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

  // Méthodes helper pour mettre à jour les filtres
  updateFilter(key: string, value: any): void {
    this.filters.update(f => ({...f, [key]: value}));
  }

  updateFilterAndApply(key: string, value: any): void {
    this.updateFilter(key, value);
    this.applyFilters();
  }
}
