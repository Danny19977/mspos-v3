import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, computed, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth/auth.service';
import { routes } from '../../shared/routes/routes';
import { LogsService } from '../user-logs/logs.service';
import { IUser } from '../user/models/user.model';
import { IRoutePlan } from './models/routeplan.model';
import { RouteplanService } from './routeplan.service';
import { RouteplanItemService } from './routeplanitem.service';
import { IRoutePlanItem } from './models/routeplanItem.model';
import { IPos } from '../pos-vente/models/pos.model';
import { PosVenteService } from '../pos-vente/pos-vente.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { db } from '../../shared/services/db'; 
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-routeplan',
  standalone: false,
  templateUrl: './routeplan.component.html',
  styleUrl: './routeplan.component.scss'
})
export class RouteplanComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IRoutePlan[] = [];
  dataListItem: IRoutePlanItem[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  dataListLocal: IRoutePlan[] = []; // Local data for routePlan
  dataListLocalItem: IRoutePlanItem[] = []; // Local data for routePlanItem

  // Table 
  displayedColumns: string[] = ['created', 'country', 'province', 'area', 'subarea', 'commune', 'agent', 'total_pos', 'pourcent', 'id'];
  dataSource = new MatTableDataSource<IRoutePlan>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';


  // Forms
  // Api
  uuidItem!: string;
  dataItem!: IRoutePlan; // Single data 
  // Local
  idItemLocal!: number;
  dataItemLocal!: IRoutePlan; // Single data


  // RoutePlanItem
  // Api
  uuidRoutePlanItem!: string;
  dataRoutePlanItem!: IRoutePlanItem; // Single data
  // Local
  idRoutePlanItemLocal!: number;
  dataRoutePlanItemLocal!: IRoutePlanItem; // Single data


  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;
  isLoadingItem = false;


  posSyncLocal: IPos[] = []; // pos synchromisation local

  posList: IPos[] = [];
  posListFilter: IPos[] = [];
  filteredOptions: IPos[] = []
  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  isload = false;
  posuuId: string = '';
  pos_name: string = '';
  pos_gerant: string = '';
  pos_shop: string = '';
  postype: string = '';


  onLine = signal<boolean>(false);
  isOnline = computed(() => navigator.onLine);

  isCreatedRoutePlan = false;

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private routeplanService: RouteplanService,
    private routePlanItemService: RouteplanItemService,
    private posVenteService: PosVenteService,
    private logActivity: LogsService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef 
  ) {
  }

  ngOnInit() {
    this.isLoadingData = true;
    this.formGroup = this._formBuilder.group({
      pos_uuid: ['', Validators.required],
      // status: ['', Validators.required],
    });

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource 
        this.cdr.detectChanges(); // Trigger change detection

        if (this.isOnline()) {
          this.routeplanService.refreshDataList$.subscribe(() => {
            this.fetchProducts(this.currentUser);
            this.cdr.detectChanges(); // Add this to fix ExpressionChangedAfterItHasBeenCheckedError
          });
          this.fetchProducts(this.currentUser);
          this.synchronisationPos(this.currentUser);
        }

        this.fecthlocalData();
        this.getLastDataRoutePlan();

        this.getAllPos(this.currentUser);
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }


  synchronisationPos(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      db.pos
        .filter((item) => item.status === true)
        .toArray()
        .then((posLocalList) => {
          console.log('List of POS with status = true:', posLocalList);
          this.posVenteService.getAllByManager(this.currentUser.country_uuid).subscribe(res => {
            const posList: IPos[] = res.data;

            // Compare posLocalList and posList
            const localUuids = posLocalList.map(localItem => localItem.uuid);
            const newItems = posList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((item: IPos) => {
              var body: IPos = {
                uuid: item.uuid,
                name: item.name,
                shop: item.shop,
                postype: item.postype,
                gerant: item.gerant,
                avenue: item.avenue,
                quartier: item.quartier,
                reference: item.reference,
                telephone: item.telephone,
                country_uuid: item.country_uuid,
                country_name: item.country_name,
                province_uuid: item.province_uuid,
                province_name: item.province_name,
                area_uuid: item.area_uuid,
                area_name: item.area_name,
                subarea_uuid: item.subarea_uuid,
                subarea_name: item.subarea_name,
                commune_uuid: item.commune_uuid,
                commune_name: item.commune_name,
                user_uuid: item.user_uuid,
                asm_uuid: item.asm_uuid,
                asm_fullname: item.asm_fullname,
                sup_uuid: item.sup_uuid,
                sup_fullname: item.sup_fullname,
                dr_uuid: item.dr_uuid,
                dr_fullname: item.dr_fullname,
                cyclo_uuid: item.cyclo_uuid,
                cyclo_fullname: item.cyclo_fullname,
                status: item.status, // le status change une fois que le pos est synchronisé
                signature: item.signature,
                CreatedAt: item.CreatedAt,
                UpdatedAt: item.UpdatedAt,
              };
              db.pos.add(body).then(() => {
                console.log('New POS added to Dexie DB');
              }).catch((error) => {
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        })
        .catch((error) => {
          console.error('Error retrieving POS with status = true from Dexie DB:', error);
        });
    } else if (currentUser.role == 'ASM') {
      db.pos
        .filter((item) => item.status === true)
        .toArray()
        .then((posLocalList) => {
          console.log('List of POS with status = true:', posLocalList);
          this.posVenteService.getAllByASM(this.currentUser.province_uuid).subscribe(res => {
            const posList: IPos[] = res.data;

            // Compare posLocalList and posList
            const localUuids = posLocalList.map(localItem => localItem.uuid);
            const newItems = posList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((item: IPos) => {
              var body: IPos = {
                uuid: item.uuid,
                name: item.name,
                shop: item.shop,
                postype: item.postype,
                gerant: item.gerant,
                avenue: item.avenue,
                quartier: item.quartier,
                reference: item.reference,
                telephone: item.telephone,
                country_uuid: item.country_uuid,
                country_name: item.country_name,
                province_uuid: item.province_uuid,
                province_name: item.province_name,
                area_uuid: item.area_uuid,
                area_name: item.area_name,
                subarea_uuid: item.subarea_uuid,
                subarea_name: item.subarea_name,
                commune_uuid: item.commune_uuid,
                commune_name: item.commune_name,
                user_uuid: item.user_uuid,
                asm_uuid: item.asm_uuid,
                asm_fullname: item.asm_fullname,
                sup_uuid: item.sup_uuid,
                sup_fullname: item.sup_fullname,
                dr_uuid: item.dr_uuid,
                dr_fullname: item.dr_fullname,
                cyclo_uuid: item.cyclo_uuid,
                cyclo_fullname: item.cyclo_fullname,
                status: item.status, // le status change une fois que le pos est synchronisé
                signature: item.signature,
                CreatedAt: item.CreatedAt,
                UpdatedAt: item.UpdatedAt,
              };
              db.pos.add(body).then(() => {
                console.log('New POS added to Dexie DB');
              }).catch((error) => {
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        })
        .catch((error) => {
          console.error('Error retrieving POS with status = true from Dexie DB:', error);
        });
    } else if (currentUser.role == 'Supervisor') {
      db.pos
        .filter((item) => item.status === true)
        .toArray()
        .then((posLocalList) => {
          console.log('List of POS with status = true:', posLocalList);
          this.posVenteService.getAllBySup(this.currentUser.area_uuid).subscribe(res => {
            const posList: IPos[] = res.data;

            // Compare posLocalList and posList
            const localUuids = posLocalList.map(localItem => localItem.uuid);
            const newItems = posList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((item: IPos) => {
              var body: IPos = {
                uuid: item.uuid,
                name: item.name,
                shop: item.shop,
                postype: item.postype,
                gerant: item.gerant,
                avenue: item.avenue,
                quartier: item.quartier,
                reference: item.reference,
                telephone: item.telephone,
                country_uuid: item.country_uuid,
                country_name: item.country_name,
                province_uuid: item.province_uuid,
                province_name: item.province_name,
                area_uuid: item.area_uuid,
                area_name: item.area_name,
                subarea_uuid: item.subarea_uuid,
                subarea_name: item.subarea_name,
                commune_uuid: item.commune_uuid,
                commune_name: item.commune_name,
                user_uuid: item.user_uuid,
                asm_uuid: item.asm_uuid,
                asm_fullname: item.asm_fullname,
                sup_uuid: item.sup_uuid,
                sup_fullname: item.sup_fullname,
                dr_uuid: item.dr_uuid,
                dr_fullname: item.dr_fullname,
                cyclo_uuid: item.cyclo_uuid,
                cyclo_fullname: item.cyclo_fullname,
                status: item.status, // le status change une fois que le pos est synchronisé
                signature: item.signature,
                CreatedAt: item.CreatedAt,
                UpdatedAt: item.UpdatedAt,
              };
              db.pos.add(body).then(() => {
                console.log('New POS added to Dexie DB');
              }).catch((error) => {
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        })
        .catch((error) => {
          console.error('Error retrieving POS with status = true from Dexie DB:', error);
        });
    } else if (currentUser.role == 'DR') {
      db.pos
        .filter((item) => item.status === true)
        .toArray()
        .then((posLocalList) => {
          console.log('List of POS with status = true:', posLocalList);
          this.posVenteService.getAllByDR(this.currentUser.subarea_uuid).subscribe(res => {
            const posList: IPos[] = res.data;

            // Compare posLocalList and posList
            const localUuids = posLocalList.map(localItem => localItem.uuid);
            const newItems = posList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((item: IPos) => {
              var body: IPos = {
                uuid: item.uuid,
                name: item.name,
                shop: item.shop,
                postype: item.postype,
                gerant: item.gerant,
                avenue: item.avenue,
                quartier: item.quartier,
                reference: item.reference,
                telephone: item.telephone,
                country_uuid: item.country_uuid,
                country_name: item.country_name,
                province_uuid: item.province_uuid,
                province_name: item.province_name,
                area_uuid: item.area_uuid,
                area_name: item.area_name,
                subarea_uuid: item.subarea_uuid,
                subarea_name: item.subarea_name,
                commune_uuid: item.commune_uuid,
                commune_name: item.commune_name,
                user_uuid: item.user_uuid,
                asm_uuid: item.asm_uuid,
                asm_fullname: item.asm_fullname,
                sup_uuid: item.sup_uuid,
                sup_fullname: item.sup_fullname,
                dr_uuid: item.dr_uuid,
                dr_fullname: item.dr_fullname,
                cyclo_uuid: item.cyclo_uuid,
                cyclo_fullname: item.cyclo_fullname,
                status: item.status, // le status change une fois que le pos est synchronisé
                signature: item.signature,
                CreatedAt: item.CreatedAt,
                UpdatedAt: item.UpdatedAt,
              };
              db.pos.add(body).then(() => {
                console.log('New POS added to Dexie DB');
              }).catch((error) => {
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        })
        .catch((error) => {
          console.error('Error retrieving POS with status = true from Dexie DB:', error);
        });
    } else if (currentUser.role == 'Cyclo') {
      db.pos
        .filter((item) => item.status === true)
        .toArray()
        .then((posLocalList) => {
          console.log('List of POS with status = true:', posLocalList);
          this.posVenteService.getAllByCyclo(this.currentUser.uuid).subscribe(res => {
            const posList: IPos[] = res.data;

            // Compare posLocalList and posList
            const localUuids = posLocalList.map(localItem => localItem.uuid);
            const newItems = posList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((item: IPos) => {
              var body: IPos = {
                uuid: item.uuid,
                name: item.name,
                shop: item.shop,
                postype: item.postype,
                gerant: item.gerant,
                avenue: item.avenue,
                quartier: item.quartier,
                reference: item.reference,
                telephone: item.telephone,
                country_uuid: item.country_uuid,
                country_name: item.country_name,
                province_uuid: item.province_uuid,
                province_name: item.province_name,
                area_uuid: item.area_uuid,
                area_name: item.area_name,
                subarea_uuid: item.subarea_uuid,
                subarea_name: item.subarea_name,
                commune_uuid: item.commune_uuid,
                commune_name: item.commune_name,
                user_uuid: item.user_uuid,
                asm_uuid: item.asm_uuid,
                asm_fullname: item.asm_fullname,
                sup_uuid: item.sup_uuid,
                sup_fullname: item.sup_fullname,
                dr_uuid: item.dr_uuid,
                dr_fullname: item.dr_fullname,
                cyclo_uuid: item.cyclo_uuid,
                cyclo_fullname: item.cyclo_fullname,
                status: item.status, // le status change une fois que le pos est synchronisé
                signature: item.signature,
                CreatedAt: item.CreatedAt,
                UpdatedAt: item.UpdatedAt,
              };
              db.pos.add(body).then(() => {
                console.log('New POS added to Dexie DB');
              }).catch((error) => {
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        })
        .catch((error) => {
          console.error('Error retrieving POS with status = true from Dexie DB:', error);
        });
    } else {
      db.pos
        .filter((item) => item.status === true)
        .toArray()
        .then((posLocalList) => {
          console.log('List of POS with status = true:', posLocalList);
          this.posVenteService.getAllByManager(this.currentUser.country_uuid).subscribe(res => {
            const posList: IPos[] = res.data;

            // Compare posLocalList and posList
            const localUuids = posLocalList.map(localItem => localItem.uuid);
            const newItems = posList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((item: IPos) => {
              var body: IPos = {
                uuid: item.uuid,
                name: item.name,
                shop: item.shop,
                postype: item.postype,
                gerant: item.gerant,
                avenue: item.avenue,
                quartier: item.quartier,
                reference: item.reference,
                telephone: item.telephone,
                country_uuid: item.country_uuid,
                country_name: item.country_name,
                province_uuid: item.province_uuid,
                province_name: item.province_name,
                area_uuid: item.area_uuid,
                area_name: item.area_name,
                subarea_uuid: item.subarea_uuid,
                subarea_name: item.subarea_name,
                commune_uuid: item.commune_uuid,
                commune_name: item.commune_name,
                user_uuid: item.user_uuid,
                asm_uuid: item.asm_uuid,
                asm_fullname: item.asm_fullname,
                sup_uuid: item.sup_uuid,
                sup_fullname: item.sup_fullname,
                dr_uuid: item.dr_uuid,
                dr_fullname: item.dr_fullname,
                cyclo_uuid: item.cyclo_uuid,
                cyclo_fullname: item.cyclo_fullname,
                status: item.status, // le status change une fois que le pos est synchronisé
                signature: item.signature,
                CreatedAt: item.CreatedAt,
                UpdatedAt: item.UpdatedAt,
              };
              db.pos.add(body).then(() => {
                console.log('New POS added to Dexie DB');
              }).catch((error) => {
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        })
        .catch((error) => {
          console.error('Error retrieving POS with status = true from Dexie DB:', error);
        });
    }
  }


  getAllPos(currentUser: IUser): void {
    const filterValue = this.pos_uuid.nativeElement.value.toLowerCase();

    this.isload = true;
    db.routePlanItems.toArray().then((routePlanItems) => {
      db.pos.toArray().then((data) => {
        const posListTrue = data.filter((item: IPos) => item.status === true);

        const localUuids = routePlanItems.map(localItem => localItem.pos_uuid);
        this.posList = posListTrue.filter(item => !localUuids.includes(item.uuid!));

        if (currentUser.role == 'Manager') {
          this.posListFilter = this.posList.filter((v: IPos) => v.country_uuid === this.currentUser.country_uuid);
        } else if (currentUser.role == 'ASM') {
          this.posListFilter = this.posList.filter((v: IPos) => v.province_uuid === this.currentUser.province_uuid);
        } else if (currentUser.role == 'Supervisor') {
          this.posListFilter = this.posList.filter((v: IPos) => v.area_uuid === this.currentUser.area_uuid);
        } else if (currentUser.role == 'DR') {
          this.posListFilter = this.posList.filter((v: IPos) => v.subarea_uuid === this.currentUser.subarea_uuid);
        } else if (currentUser.role == 'Cyclo') {
          this.posListFilter = this.posList.filter((v: IPos) => v.user_uuid === this.currentUser.uuid);
        }
        this.filteredOptions = this.posListFilter.filter(o => o.name.toLowerCase().includes(filterValue));
        this.isload = false;
      }).catch((error) => {
        this.isload = false;
        console.error('Error getting data from Dexie DB:', error);
      });
    });
  }

  displayFn(pos: any): any {
    return pos && pos.name ? pos.name : '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    // const pos_uuid = selectedOption.uuid;
    // const name = selectedOption.name;
    this.posuuId = selectedOption.uuid;
    this.pos_name = selectedOption.name;
    this.pos_gerant = selectedOption.gerant;
    this.pos_shop = selectedOption.shop;
    this.postype = selectedOption.postype;
    // Utilisez id et fullName comme vous le souhaitez
    console.log('pos_uuid:', this.posuuId);
    console.log('Name:', this.pos_name);
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;

    if (this.onLine()) {
      this.fetchProducts(this.currentUser);
    } else {
      this.fecthlocalData();
    }

  }

  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.routeplanService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'ASM') {
      this.routeplanService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log("data 22 ", res.data);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.routeplanService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      this.routeplanService.getPaginatedBySubAreaId(currentUser.subarea_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Cyclo') {
      this.routeplanService.getPaginatedByUserId(currentUser.uuid, this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.routeplanService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    };
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

  // Fetch local data and synchronise with server
  fecthlocalData() {
    db.routePlans.toArray().then((data) => {
      this.dataListLocal = data;
      console.log('RoutePlan local:', this.dataListLocal);

      if (this.dataListLocal.length > 0 && navigator.onLine) {
        this.isLoading = true;
        this.dataListLocal.forEach((item: IRoutePlan) => {

          const createdAt = new Date(item.CreatedAt);
          const currentTime = new Date();
          const timeDifference = currentTime.getTime() - createdAt.getTime();
          const hoursDifference = timeDifference / (1000 * 60 * 60);

          if (hoursDifference >= 24) {
            this.routeplanService.create(item).subscribe({
              next: () => {
                // synchronisation RoutePlantItems 
                db.routePlanItems.toArray().then((routePlanItems) => {
                  const routePlanItemList = routePlanItems;

                  routePlanItemList.forEach((item: IRoutePlanItem) => {
                    var body: IRoutePlanItem = {
                      routplan_uuid: item.routplan_uuid,
                      pos_uuid: item.pos_uuid,
                      status: item.status,
                      CreatedAt: item.CreatedAt,
                      UpdatedAt: item.UpdatedAt,
                    };
                    this.routePlanItemService.create(body).subscribe({
                      next: () => {
                        db.routePlanItems.delete(item.id!).then(() => {
                          console.log('RoutePlanItem deleted from Dexie DB');
                          this.toastr.success('Synchronisation effectuée avec succès!', 'Success!');
                        }).catch((error) => {
                          console.error('Error deleting RoutePlanItem from Dexie DB:', error);
                          this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                        });
                      },
                      error: (err) => {
                        this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                        console.log(err);
                      }
                    });
                  });
                }).catch((error) => {
                  console.error('Error retrieving RoutePlanItems from Dexie DB:', error);
                  this.isLoadingData = false;
                  this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                });
                // Delete item from local database
                db.routePlans.delete(item.id!).then(() => {
                  this.isLoadingData = false;
                  this.toastr.info('Supprimé avec succès!', 'Success!');
                }).catch((error) => {
                  console.error('Error deleting item from Dexie DB:', error);
                });
              },
              error: (err) => {
                this.isLoadingData = false;
                this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                console.log(err);
              }
            });
          }
        });
      }
    });
  }


  // Create new RoutePlan
  onSubmit() {
    try {
      this.isLoading = true;
      var body: IRoutePlan = {
        uuid: uuidv4(),
        country_uuid: this.currentUser.country_uuid,
        country_name: this.currentUser.country_name,
        province_uuid: this.currentUser.province_uuid,
        province_name: this.currentUser.province_name,
        area_uuid: this.currentUser.area_uuid,
        area_name: this.currentUser.area_name,
        subarea_uuid: this.currentUser.subarea_uuid,
        subarea_name: this.currentUser.subarea_name,
        commune_uuid: this.currentUser.commune_uuid,
        commune_name: this.currentUser.commune_name,
        user_uuid: this.currentUser.uuid,
        user_fullname: this.currentUser.fullname,
        signature: this.currentUser.fullname,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      };
      db.routePlans.add(body).then(() => {
        this.fecthlocalData();
        this.isLoading = false;
        this.formGroup.reset();
        this.toastr.success('Ajouter avec succès!', 'Success!');
      }).catch((error) => {
        this.isLoading = false;
        console.error('Error adding item to Dexie DB:', error);
      });
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }


  // Create new RoutePlanItem
  onSubmitItem() {
    try {
      if (this.formGroup.valid) {
        this.isLoadingItem = true;
        var body: IRoutePlanItem = {
          uuid: uuidv4(),
          routplan_uuid: this.dataItemLocal.uuid!,
          pos_uuid: this.posuuId,
          pos_name: this.pos_name,
          pos_gerant: this.pos_gerant,
          pos_shop: this.pos_shop,
          postype: this.postype,
          status: false,
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
        };
        console.log('RoutePlanItem:', body);
        db.routePlanItems.add(body).then(() => {
          this.getAllRoutePlanItemLocal(this.dataItemLocal.uuid!);
          this.isLoadingItem = false;
          this.formGroup.reset();
          this.toastr.success('POS Ajouter avec succès!', 'Success!');
        }).catch((error) => {
          this.isLoadingItem = false;
          console.error('Error adding item to Dexie DB:', error);
        });
      }
    } catch (error) {
      this.isLoadingItem = false;
      console.log(error);
    }
  }


  // Get value RoutePlan api
  findValue(value: any) {
    this.uuidItem = value;
    this.routeplanService.get(this.uuidItem).subscribe(item => {
      this.dataItem = item.data;
      console.log('RoutePlan:', this.dataItem);
      this.getAllRoutePlanItemApi(this.dataItem.uuid!);
      this.formGroup.patchValue({
        user_uuid: this.dataItem.user_uuid,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        subarea_uuid: this.dataItem.subarea_uuid,
        commune_uuid: this.dataItem.commune_uuid,
      });
    });
  }

  // Get value RoutePlan local
  findValueLocal(value: number) {
    this.idItemLocal = value;
    db.routePlans.get(this.idItemLocal).then(item => {
      this.dataItemLocal = item!;
      console.log('RoutePlan local:', this.dataItemLocal);
      this.getAllRoutePlanItemLocal(this.dataItemLocal.uuid!);
      this.formGroup.patchValue({
        user_uuid: this.dataItemLocal.user_uuid,
        country_uuid: this.dataItemLocal.country_uuid,
        province_uuid: this.dataItemLocal.province_uuid,
        area_uuid: this.dataItemLocal.area_uuid,
        subarea_uuid: this.dataItemLocal.subarea_uuid,
        commune_uuid: this.dataItemLocal.commune_uuid,
      });
    });
  }

  // Get last data RoutePlan
  getLastDataRoutePlan() {
    db.routePlans
      .orderBy('CreatedAt')
      .last()
      .then((item) => {
        if (item) {

          const createdAt = new Date(item.CreatedAt);
          const currentTime = new Date();
          const timeDifference = currentTime.getTime() - createdAt.getTime();
          const hoursDifference = timeDifference / (1000 * 60 * 60);

          if (hoursDifference >= 24) {
            this.isCreatedRoutePlan = true;
          } else {
            this.isCreatedRoutePlan = false;
          }

          console.log('isCreatedRoutePlan:', this.isCreatedRoutePlan);
        } else {
          console.log('No RoutePlan found');
        }
      })
      .catch((error) => {
        console.error('Error retrieving last RoutePlan from Dexie DB:', error);
      });
  }


  // RoutePlanItem APi
  getAllRoutePlanItemApi(uuid: string) {
    this.routePlanItemService.getAllById(uuid).subscribe(res => {
      this.dataListItem = res.data;
      console.log('RoutePlanItems for UUID:', uuid, this.dataListItem);
    });
  }

  // RoutePlanItem Local
  getAllRoutePlanItemLocal(uuid: string) {
    db.routePlanItems
      .filter((item: IRoutePlanItem) => item.routplan_uuid === uuid)
      .toArray()
      .then((items) => {
        this.dataListLocalItem = items;
        console.log('RoutePlanItems for UUID:', uuid, items);
      })
      .catch((error) => {
        console.error('Error retrieving RoutePlanItems from Dexie DB:', error);
      });
  }

  // RoutePlanItem pour le tableau
  getAllRoutePlanItemArray(uuid: string): Promise<number> {
    console.log('UUID:', uuid);
    return db.routePlanItems
      .filter((item: IRoutePlanItem) => item.routplan_uuid === uuid)
      .count()
      .then(count => count || 0) // Return count or 0 if null
      .catch(() => 0); // Return 0 in case of an error
  }


  // Get value RoutePlanItem api
  findValueItem(value: string) {
    this.uuidRoutePlanItem = value;
    this.routePlanItemService.get(this.uuidRoutePlanItem).subscribe(item => {
      this.dataRoutePlanItem = item.data;
      this.formGroup.patchValue({
        routplan_uuid: this.dataRoutePlanItem.routplan_uuid,
        pos_uuid: this.dataRoutePlanItem.pos_uuid,
        status: this.dataRoutePlanItem.status,
      });
    });
  }

  // Get value RoutePlanItem local
  findValueRoutePlanItemLocal(value: number) {
    this.idRoutePlanItemLocal = value;
    db.routePlanItems.get(this.idRoutePlanItemLocal).then(item => {
      this.dataRoutePlanItemLocal = item!;
      this.formGroup.patchValue({
        routplan_uuid: this.dataRoutePlanItemLocal.routplan_uuid,
        pos_uuid: this.dataRoutePlanItemLocal.pos_uuid,
        status: this.dataRoutePlanItemLocal.status,
      });
    });
  }



  delete(): void {
    this.routeplanService
      .delete(this.uuidItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'RoutePlan',
            this.currentUser.uuid,
            'deleted',
            `Delete RoutePlan uuid: ${this.uuidItem}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
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


  deletRouteplan(): void {
    db.routePlans.delete(this.dataItemLocal.id!).then(() => {
      this.fecthlocalData();
      this.isLoading = false;
      this.toastr.success('Supprimé avec succès!', 'Success!');
    }).catch((error) => {
      this.isLoading = false;
      console.error('Error deleting item from Dexie DB:', error);
    });
  }

  deletRouteplanItem(): void {
    db.routePlanItems.delete(this.idRoutePlanItemLocal).then(() => {
      this.getAllRoutePlanItemLocal(this.dataRoutePlanItemLocal.routplan_uuid!);
      this.isLoading = false;
      this.toastr.success('Supprimé avec succès!', 'Success!');
    }).catch((error) => {
      this.isLoading = false;
      console.error('Error deleting item from Dexie DB:', error);
    });
  }

}

