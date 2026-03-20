import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, computed, signal, inject, DestroyRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../auth/auth.service';
import { routes } from '../../../shared/routes/routes';
import { LogsService } from '../../management/user-logs/logs.service';
import { IUser } from '../../management/user/models/user.model';
import { IRoutePlan } from './models/routeplan.model';
import { RouteplanService } from './routeplan.service';
import { RouteplanItemService } from './routeplanitem.service';
import { IRoutePlanItem } from './models/routeplanItem.model';
import { IPos } from '../pos-vente/models/pos.model';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NetworkService } from '../../../services/network.service';
import { SyncQueueService } from '../../../shared/services/sync-queue.service';
import { DataSyncService } from '../../../shared/services/data-sync.service';
import { db } from '../../../shared/services/db';

@Component({
  selector: 'app-routeplan',
  standalone: false,
  templateUrl: './routeplan.component.html',
  styleUrl: './routeplan.component.scss'
})
export class RouteplanComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly routeplanService = inject(RouteplanService);
  private readonly routePlanItemService = inject(RouteplanItemService);
  private readonly logActivity = inject(LogsService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly networkService = inject(NetworkService);
  private readonly syncQueueService = inject(SyncQueueService);
  private readonly dataSyncService = inject(DataSyncService);

  readonly isUploadSyncing = signal<boolean>(false);
  readonly isDownloadSyncing = signal<boolean>(false);
  readonly pendingUploadCount = signal<number>(0);
  readonly downloadEntity = signal<string>('');

  readonly isLoadingData = signal(false);
  readonly isLoadingDataItem = signal(false);
  readonly isOnline = signal(true);
  public routes = routes;
  readonly dataList = signal<IRoutePlan[]>([]);
  readonly dataListLocal = signal<IRoutePlan[]>([]);
  readonly dataListItem = signal<IRoutePlanItem[]>([]);
  readonly total_pages = signal(0);
  readonly page_size = signal(15);
  readonly current_page = signal(1);
  readonly total_records = signal(0);

  displayedColumns: string[] = ['created', 'country', 'province', 'area', 'subarea', 'commune', 'user', 'total_pos', 'pourcent', 'uuid'];
  readonly dataSource = signal(new MatTableDataSource<IRoutePlan>([]));

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly search = signal('');

  readonly uuidItem = signal('');
  readonly dataItem = signal<IRoutePlan | null>(null);

  readonly uuidRoutePlanItem = signal('');
  readonly dataRoutePlanItem = signal<IRoutePlanItem | null>(null);

  readonly formGroup = signal<FormGroup>(this._formBuilder.group({
    pos_uuid: ['', Validators.required],
  }));
  readonly currentUser = signal<IUser | null>(null);
  readonly isLoading = signal(false);
  readonly isLoadingItem = signal(false);

  readonly posList = signal<IPos[]>([]);
  readonly posListFilter = signal<IPos[]>([]);
  readonly filteredOptions = signal<IPos[]>([]);
  readonly posAllFiltered = signal<IPos[]>([]);
  readonly posPageSize = 10;
  readonly posCurrentPage = signal(1);
  readonly hasMorePos = signal(false);
  readonly posRawCache = signal<IPos[]>([]);
  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  readonly isload = signal(false);
  readonly posuuId = signal('');

  readonly isRoutePlanCreatedRecently = signal<boolean>(false);

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

    // Suivre l'état de la connexion
    this.networkService.getNetworkStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        this.isOnline.set(status);
        // Recharger les données quand la connexion change
        if (this.currentUser()) {
          this.fetchProducts(this.currentUser()!);
        }
      });

    this.authService.user().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.isOnline.set(this.networkService.isOnline());
        this.dataSource().paginator = this.paginator;
        this.dataSource().sort = this.sort;
        this.cdr.detectChanges();

        this.routeplanService.refreshDataList$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.fetchProducts(this.currentUser()!);
          this.cdr.detectChanges();
        });
        this.fetchProducts(this.currentUser()!);

        this.getAllPos(this.currentUser()!);
      },
      error: (error) => {
        this.isLoadingData.set(false);
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }



  /** Retourne l'UUID territoire principal selon le rôle de l'utilisateur */
  private getTerritoryUuid(user: IUser): string {
    if (user.role === 'ASM') return user.province_uuid;
    if (user.role === 'Supervisor') return user.area_uuid;
    if (user.role === 'DR') return user.sub_area_uuid;
    if (user.role === 'Cyclo') return user.commune_uuid;
    return '';
  }

  /** Filtre en mémoire depuis posRawCache — aucun accès IndexedDB */
  private applyPosFilter(): void {
    const filterValue = this.pos_uuid?.nativeElement?.value?.toLowerCase().trim() || '';
    const posUuidsInPlan = new Set(this.dataListItem().map(item => item.pos_uuid));
    let filtered = this.posRawCache().filter(pos => pos.uuid && !posUuidsInPlan.has(pos.uuid));
    if (filterValue) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(filterValue) ||
        p.shop?.toLowerCase().includes(filterValue) ||
        p.gerant?.toLowerCase().includes(filterValue)
      );
    }
    this.posListFilter.set(filtered);
    this.posAllFiltered.set(filtered);
    this.posCurrentPage.set(1);
    this.filteredOptions.set(filtered.slice(0, this.posPageSize));
    this.hasMorePos.set(filtered.length > this.posPageSize);
  }

  /** Appelé depuis le template sur (input) — filtrage instantané en mémoire */
  onPosInput(): void {
    this.applyPosFilter();
  }

  /**
   * Charge les POS depuis IndexedDB UNE SEULE FOIS (si cache vide).
   * Les appels suivants filtrent uniquement en mémoire.
   * Passer forceReload=true pour forcer un rechargement depuis la DB.
   */
  getAllPos(currentUser: IUser, forceReload = false): void {
    // Cache déjà chargé → juste filtrer en mémoire, aucun accès DB
    if (this.posRawCache().length > 0 && !forceReload) {
      this.applyPosFilter();
      return;
    }

    this.isload.set(true);
    const territoryUuid = this.getTerritoryUuid(currentUser);
    this.routeplanService.getLocalPosForRoutePlan(currentUser.uuid, currentUser.role, territoryUuid).subscribe(res => {
      const posList: IPos[] = res.data || [];
      // Dédoublonnage par uuid
      const seen = new Set<string>();
      const unique = posList.filter(pos => {
        if (!pos.uuid || seen.has(pos.uuid)) return false;
        seen.add(pos.uuid);
        return true;
      });
      this.posList.set(unique);
      this.posRawCache.set(unique);
      this.applyPosFilter();
      this.isload.set(false);
    });
  }

  displayFn(pos: IPos): any {
    return pos && pos.name ? pos.name : '';
  }

  getAreaName(pos: IPos): string {
    return pos.area_name
      || (typeof (pos.Area as any)?.name === 'string' ? (pos.Area as any).name : '')
      || '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posuuId.set(selectedOption.uuid);
    console.log('pos_uuid:', this.posuuId());
  }

  onPosSearchChange() {
    this.applyPosFilter();
  }

  loadMorePos(): void {
    const nextPage = this.posCurrentPage() + 1;
    const end = nextPage * this.posPageSize;
    this.filteredOptions.set(this.posAllFiltered().slice(0, end));
    this.posCurrentPage.set(nextPage);
    this.hasMorePos.set(end < this.posAllFiltered().length);
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1);
    this.page_size.set(event.pageSize);

    this.fetchProducts(this.currentUser()!);
  }

  fetchProducts(currentUser: IUser) {
    // Réinitialiser l'état avant chaque chargement
    this.isRoutePlanCreatedRecently.set(false);

    // Toujours charger les données locales en attente de sync
    this.routeplanService.getLocalPendingRoutePlans(currentUser.uuid).then(async localPending => {
      // Enrichir les plans locaux avec les données de l'utilisateur courant
      const enrichedLocalPlans: IRoutePlan[] = localPending.map(plan => ({
        ...plan,
        sync_status: 'pending',
        Country:  plan.Country  || currentUser.Country  || { name: '...' },
        Province: plan.Province || currentUser.Province || { name: '...' },
        Area:     plan.Area     || currentUser.Area     || { name: '...' },
        SubArea:  (plan as any).SubArea  || (plan as any).Subarea || currentUser.SubArea || { name: '...' },
        Commune:  plan.Commune  || currentUser.Commune  || { name: '...' },
        User:     plan.User     || { fullname: currentUser.fullname || '--' } as IUser,
      }));

      this.dataListLocal.set(enrichedLocalPlans);

      // Vérifier si un plan a déjà été créé aujourd'hui (00h00 - 23h59) pour cet utilisateur
      // Inclut les plans locaux en attente + les plans serveur
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const hasTodayLocalPlan = enrichedLocalPlans.some(plan => {
        const d = new Date(plan.CreatedAt!);
        return d >= todayStart && d <= todayEnd && plan.user_uuid === currentUser.uuid;
      });

      // Vérifier aussi les plans synchronisés (sync_status = 'synced') dans IndexedDB
      // hasTodayRoutePlan() cherche TOUS les plans du jour sans filtre sur sync_status
      const hasTodaySyncedLocalPlan = await this.routeplanService.hasTodayRoutePlan(currentUser.uuid);

      if (hasTodayLocalPlan || hasTodaySyncedLocalPlan) {
        this.isRoutePlanCreatedRecently.set(true);
      }

      const mergeWithLocal = (serverData: IRoutePlan[]) => {
        // Filtrer les plans locaux qui ne sont pas déjà dans les données serveur
        const serverUuids = new Set(serverData.map(p => p.uuid));
        const pendingNotOnServer = enrichedLocalPlans.filter(
          p => p.temp_id && !serverUuids.has(p.temp_id) && !serverUuids.has(p.uuid)
        );
        // Données locales d'abord, puis données serveur
        return [...pendingNotOnServer, ...serverData];
      };

      if (this.networkService.isOnline()) {
        // Mode ONLINE : charger depuis le serveur puis fusionner
        let apiCall$;
        if (currentUser.role === 'Manager') {
          apiCall$ = this.routeplanService.getPaginated2(this.current_page(), this.page_size(), this.search());
        } else if (currentUser.role === 'ASM') {
          apiCall$ = this.routeplanService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page(), this.page_size(), this.search());
        } else if (currentUser.role === 'Supervisor') {
          apiCall$ = this.routeplanService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page(), this.page_size(), this.search());
        } else if (currentUser.role === 'DR') {
          apiCall$ = this.routeplanService.getPaginatedBySubAreaId(currentUser.sub_area_uuid, this.current_page(), this.page_size(), this.search());
        } else if (currentUser.role === 'Cyclo') {
          apiCall$ = this.routeplanService.getPaginatedByUserId(currentUser.uuid, this.current_page(), this.page_size(), this.search());
        } else {
          apiCall$ = this.routeplanService.getPaginated2(this.current_page(), this.page_size(), this.search());
        }

        apiCall$.subscribe({
          next: (res) => {
            const merged = mergeWithLocal(res.data || []);
            this.dataList.set(res.data || []);
            this.total_pages.set(res.pagination?.total_pages || 0);
            this.total_records.set((res.pagination?.total_records || 0) + enrichedLocalPlans.length);
            this.dataSource().data = merged;

            // Vérifier si un plan du jour (00h-23h59) existe pour cet utilisateur (tous rôles)
            // Ne faire la vérification serveur que si aucun plan local du jour n'a été trouvé
            // (ni en pending ni en synced dans IndexedDB)
            if (!hasTodayLocalPlan && !hasTodaySyncedLocalPlan) {
              const serverHasToday = (res.data || []).some((plan: any) => {
                if (plan.user_uuid !== currentUser.uuid) return false;
                const d = new Date(plan.CreatedAt || plan.created);
                return !isNaN(d.getTime()) && d >= todayStart && d <= todayEnd;
              });
              this.isRoutePlanCreatedRecently.set(serverHasToday);
            }
            this.isLoadingData.set(false);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('❌ Erreur chargement server, affichage données locales:', err);
            this.dataList.set([]);
            this.dataSource().data = enrichedLocalPlans;
            this.total_records.set(enrichedLocalPlans.length);
            this.isLoadingData.set(false);
            this.cdr.detectChanges();
          }
        });
      } else {
        // Mode OFFLINE : afficher uniquement les données locales
        this.dataList.set([]);
        this.dataSource().data = enrichedLocalPlans;
        this.total_records.set(enrichedLocalPlans.length);
        this.isLoadingData.set(false);
        this.cdr.detectChanges();
      }
    });
  }


  getRoutePlanItemCount(routeplanItem: IRoutePlanItem[]): string {
    return routeplanItem ? routeplanItem.length > 0 ? routeplanItem.length.toString() : '0' : '0';
  }

  getRoutePlanItemTrueCount(routeplanItem: IRoutePlanItem[]): string {
    if (!routeplanItem) {
      return '0';
    }
    const trueCount = routeplanItem.filter(item => item.status === true).length;
    return trueCount > 0 ? trueCount.toString() : '0';
  }

  getProgressionPercentage(routeplanItem: IRoutePlanItem[]): string {
    if (!routeplanItem || routeplanItem.length === 0) {
      return '0';
    }
    const trueCount = routeplanItem.filter(item => item.status === true).length;
    const totalCount = routeplanItem.length;
    const percentage = (trueCount / totalCount) * 100;
    return percentage > 0 ? percentage.toFixed(1) : '0';
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
    this.dataSource().filter = filterValue.trim().toLowerCase();
  }

  // Get All routeplamitems (online)
  getAllRoutePlanItems(value: string) {
    this.isLoadingDataItem.set(true);
    this.uuidRoutePlanItem.set(value);
    this.routePlanItemService.getAllById(this.uuidRoutePlanItem()).subscribe({
      next: async (res) => {
        const items: IRoutePlanItem[] = res.data || [];

        // Enrichir les items dont le Pos n'est pas peuple par l'API
        const enrichedItems: IRoutePlanItem[] = await Promise.all(
          items.map(async item => {
            if (item.Pos && (item.Pos.name || item.Pos.shop)) return item;
            const pos = await db.pos.where('uuid').equals(item.pos_uuid).first();
            return {
              ...item,
              Pos: pos || item.Pos || { uuid: item.pos_uuid, name: item.pos_uuid, shop: '--', postype: '--', gerant: '--' } as IPos
            };
          })
        );

        this.dataListItem.set(enrichedItems);
        this.isLoadingDataItem.set(false);

        // Si des items sont encore en attente et qu'on est online,
        // declencher la sync en arriere-plan puis rafraichir la liste
        const hasPending = items.some((i: any) => i.sync_status === 'pending');
        if (hasPending && this.isOnline()) {
          this.syncQueueService.processQueue().then(() => {
            // Re-fetch apres sync pour mettre a jour les badges
            this.routePlanItemService.getAllById(value).subscribe(fresh => {
              this.dataListItem.set(fresh.data || []);
              this.cdr.detectChanges();
            });
          }).catch(err => console.warn('sync items arriere-plan:', err?.message));
        }
      },
      error: (err) => {
        console.error('Erreur chargement items (API), fallback local:', err);
        // Fallback : charger depuis le cache local
        this.getAllRoutePlanItemsLocal(value);
      }
    });
  }

  // Get All routeplanitems depuis le cache local (offline)
  async getAllRoutePlanItemsLocal(routeplanUuid: string) {
    this.isLoadingDataItem.set(true);
    this.uuidRoutePlanItem.set(routeplanUuid);
    try {
      // Interroger par l'index Dexie (sans 'e')
      let items = await db.routePlanItems
        .where('routplan_uuid').equals(routeplanUuid)
        .toArray();

        console.log(`📦 Items locaux (index) pour ${routeplanUuid}:`, items.length);

      // Fallback : items du serveur mis en cache avec routeplan_uuid (avec 'e')
      if (items.length === 0) {
        items = await db.routePlanItems
          .filter(item => (item as any).routeplan_uuid === routeplanUuid)
          .toArray();
      }

      // Enrichir chaque item avec les données POS depuis le cache local
      const enrichedItems: IRoutePlanItem[] = await Promise.all(
        items.map(async item => {
          const pos = await db.pos.where('uuid').equals(item.pos_uuid).first();
          return {
            ...item,
            Pos: pos || { uuid: item.pos_uuid, name: item.pos_uuid, shop: '--', postype: '--', gerant: '--' } as IPos
          };
        })
      );

      this.dataListItem.set(enrichedItems);
    } catch (err) {
      console.error('❌ Erreur chargement items locaux:', err);
      this.dataListItem.set([]);
    }
    this.isLoadingDataItem.set(false);
  }

  // Get value RoutePlan (gère local + serveur)
  findValue(value: any) {
    this.uuidItem.set(value);

    // Vérifier d'abord si c'est un plan local en attente de sync
    const localPlan = this.dataListLocal().find(
      p => p.uuid === value || (p as any).temp_id === value
    );
    if (localPlan) {
      this.dataItem.set(localPlan);
      this.getAllRoutePlanItemsLocal(localPlan.uuid || value);
      setTimeout(() => this.applyPosFilter(), 100);
      return;
    }

    // Plan serveur : appel API normal
    this.routeplanService.get(this.uuidItem()).subscribe(item => {
      this.dataItem.set(item.data);
      // Toujours passer par getAllRoutePlanItems qui fusionne
      // les items serveur + items locaux pending non encore soumis
      this.getAllRoutePlanItems(this.dataItem()!.uuid!);
      setTimeout(() => this.applyPosFilter(), 100);
      this.formGroup().patchValue({
        user_uuid: this.dataItem()!.user_uuid,
        country_uuid: this.dataItem()!.country_uuid,
        province_uuid: this.dataItem()!.province_uuid,
        area_uuid: this.dataItem()!.area_uuid,
        sub_area_uuid: this.dataItem()!.sub_area_uuid,
        commune_uuid: this.dataItem()!.commune_uuid,
      });
    });
  }


  // Get value RoutePlanItem (gère local + serveur)
  findValueItem(value: string) {
    this.uuidRoutePlanItem.set(value);

    // Si offline ou item local, chercher dans le cache
    if (!this.isOnline()) {
      db.routePlanItems.where('uuid').equals(value).first().then(item => {
        if (item) {
          this.dataRoutePlanItem.set(item as any);
        }
      });
      return;
    }

    this.routePlanItemService.get(this.uuidRoutePlanItem()).subscribe(item => {
      this.dataRoutePlanItem.set(item.data);
      this.formGroup().patchValue({
        routeplan_uuid: this.dataRoutePlanItem()!.routeplan_uuid,
        pos_uuid: this.dataRoutePlanItem()!.pos_uuid,
        status: this.dataRoutePlanItem()!.status,
      });
    });
  }

  // Create new RoutePlan
  onSubmit() {
    try {
      this.isLoading.set(true);
      var body: IRoutePlan = {
        country_uuid: this.currentUser()!.country_uuid,
        province_uuid: this.currentUser()!.province_uuid,
        area_uuid: this.currentUser()!.area_uuid,
        sub_area_uuid: this.currentUser()!.sub_area_uuid,
        commune_uuid: this.currentUser()!.commune_uuid,
        user_uuid: this.currentUser()!.uuid,
        signature: this.currentUser()!.fullname,
      };
      this.routeplanService.create(body).subscribe({
        next: (res) => {
          this.dataItem.set(res.data);
          this.logActivity.activity(
            'RoutePlan',
            this.currentUser()!.uuid,
            'created',
            `Create RoutePlan uuid: ${body.uuid}`,
            this.currentUser()!.fullname
          ).subscribe({
            next: () => {},
            error: (err) => { console.log('logActivity error:', err); }
          });
          this.toastr.success('Ajouter avec succès!', 'Success!');
          this.fetchProducts(this.currentUser()!);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastr.error(`${err?.error?.message || 'Une erreur s\'est produite'}`, 'Oupss!');
          console.log(err);
        }
      });
    } catch (error) {
      this.isLoading.set(false);
      console.log(error);
    }
  }


  // Create new RoutePlanItem
  onSubmitItem() {
    try {
      if (this.formGroup().valid) {
        // Vérifier si ce POS est déjà dans le plan
        const alreadyExists = this.dataListItem().some(item => item.pos_uuid === this.posuuId());
        if (alreadyExists) {
          this.toastr.warning('Ce POS est déjà dans le plan de route!', 'Doublon détecté');
          return;
        }

        this.isLoadingItem.set(true);
        var body: IRoutePlanItem = {
          routeplan_uuid: this.dataItem()!.uuid!,
          pos_uuid: this.posuuId(),
          status: false,
        };
        this.routePlanItemService.create(body).subscribe({
          next: (_res) => {
            this.formGroup().reset();
            this.pos_uuid.nativeElement.value = '';
            // Toujours recharger depuis le cache local (local-first)
            this.getAllRoutePlanItemsLocal(this.dataItem()!.uuid!);
            // Re-filtrer après que dataListItem soit mis à jour (async)
            setTimeout(() => this.applyPosFilter(), 100);
            this.toastr.success('POS Ajouté avec succès!', 'Success!');
            this.isLoadingItem.set(false);
          },
          error: (err) => {
            this.isLoadingItem.set(false);
            this.toastr.error(`${err?.error?.message || 'Une erreur s\'est produite'}`, 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoadingItem.set(false);
      console.log(error);
    }
  }

  onSubmitUpdateItem() {
    try {
      if (this.formGroup().valid) {
        this.isLoadingItem.set(true);
        var body: IRoutePlanItem = {
          uuid: this.dataRoutePlanItem()!.uuid,
          routeplan_uuid: this.dataRoutePlanItem()!.routeplan_uuid,
          pos_uuid: this.dataRoutePlanItem()!.pos_uuid,
          status: true,
        };
        this.routePlanItemService.update(this.uuidRoutePlanItem(), body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'RoutePlanItem',
              this.currentUser()!.uuid,
              'updated',
              `Update RoutePlanItem uuid: ${body.uuid}`,
              this.currentUser()!.fullname
            ).subscribe({
              next: () => {},
              error: (err) => { console.log('logActivity error:', err); }
            });
            this.toastr.success('POS Modifier avec succès!', 'Success!');
            this.isLoadingItem.set(false);
          },
          error: (err) => {
            this.isLoadingItem.set(false);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoadingItem.set(false);
      console.log(error);
    }
  }


  // Delete RoutePlan
  delete(): void {
    this.routeplanService
      .delete(this.uuidItem())
      .subscribe({
        next: () => {
          // 1. Rafraîchir immédiatement le tableau depuis le cache local
          this.fetchProducts(this.currentUser()!);

          // 2. Synchroniser en arrière-plan si online
          if (this.isOnline()) {
            this.syncQueueService.processQueue().catch(err =>
              console.warn('⚠️ Sync arrière-plan delete routeplan (non bloquant):', err?.message)
            );
          }

          // 3. Log activité
          if (this.isOnline()) {
            this.logActivity.activity(
              'RoutePlan',
              this.currentUser()!.uuid,
              'deleted',
              `Delete RoutePlan uuid: ${this.uuidItem()}`,
              this.currentUser()!.fullname
            ).subscribe({
              next: () => {},
              error: (err) => { console.log('logActivity error:', err); }
            });
          }

          this.toastr.info('Supprimé avec succès!', 'Success!');
          this.isLoading.set(false);
        },
        error: err => {
          this.toastr.error(`${err?.error?.message || 'Une erreur s\'est produite'}`, 'Oupss!');
          console.log(err);
        }
      });
  }


  // Delete RoutePlanItem
  deleteItem(): void {
    this.routePlanItemService
      .delete(this.uuidRoutePlanItem())
      .subscribe({
        next: () => {
          // 1. Rafraîchir immédiatement la liste des items du panel
          this.getAllRoutePlanItemsLocal(this.dataItem()!.uuid!);

          // 2. Rafraîchir le tableau principal (compteurs total_pos, etc.)
          this.fetchProducts(this.currentUser()!);

          // 3. Mettre à jour le dropdown POS (en mémoire, après maj dataListItem)
          setTimeout(() => this.applyPosFilter(), 100);

          // 4. Synchroniser en arrière-plan si online
          if (this.isOnline()) {
            this.syncQueueService.processQueue().catch(err =>
              console.warn('⚠️ Sync arrière-plan delete routeplanItem (non bloquant):', err?.message)
            );
            this.logActivity.activity(
              'RoutePlanItem',
              this.currentUser()!.uuid,
              'deleted',
              `Delete RoutePlanItem uuid: ${this.uuidRoutePlanItem()}`,
              this.currentUser()!.fullname
            ).subscribe({
              next: () => {},
              error: (err) => { console.log('logActivity error:', err); }
            });
          }

          this.toastr.info('POS Supprimé avec succès!', 'Success!');
          this.isLoading.set(false);
        },
        error: err => {
          this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
          console.log(err);
        }
      });
  }

  isLessThan24HoursOld(created: Date): boolean {
    const createdDate = new Date(created);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    return createdDate >= today && createdDate <= endOfToday;
  }
}

