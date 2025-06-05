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

@Component({
  selector: 'app-routeplan',
  standalone: false,
  templateUrl: './routeplan.component.html',
  styleUrl: './routeplan.component.scss'
})
export class RouteplanComponent implements OnInit {
  isLoadingData = false;
  isLoadingDataItem = false; // Loading state for data RoutePlanItem
  public routes = routes;
  // Table 
  dataList: IRoutePlan[] = [];
  dataListItem: IRoutePlanItem[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['created', 'country', 'province', 'area', 'subarea', 'commune', 'user', 'uuid']; //  'total_pos', 'pourcent',
  dataSource = new MatTableDataSource<IRoutePlan>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  uuidItem: string = '';
  dataItem!: IRoutePlan; // Single data  


  uuidRoutePlanItem: string = '';
  dataRoutePlanItem!: IRoutePlanItem; // Single data

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;
  isLoadingItem = false;

  posList: IPos[] = [];
  posListFilter: IPos[] = [];
  filteredOptions: IPos[] = [];
  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  isload = false;
  posuuId: string = '';

  isRoutePlanCreatedRecently = signal<boolean>(false); // Signal to track if a RoutePlan was created recently


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

        this.routeplanService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser);
          this.cdr.detectChanges(); // Add this to fix ExpressionChangedAfterItHasBeenCheckedError
        });
        this.fetchProducts(this.currentUser);

        this.getAllPos(this.currentUser);
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }



  getAllPos(currentUser: IUser): void {
    if (currentUser.role == 'Manager') {
      const filterValue = this.pos_uuid.nativeElement.value.toLowerCase();
      this.isload = true;
      this.posVenteService.getAll().subscribe(res => {
        this.posList = res.data;
        const posUuidsInCurrentDataList = this.dataListItem.map(item => item.pos_uuid);
        this.posListFilter = this.posList.filter(pos => pos.uuid && !posUuidsInCurrentDataList.includes(pos.uuid));
        this.filteredOptions = this.posListFilter.filter(o => o.name.toLowerCase().includes(filterValue));
        this.isload = false;
      });
    } else if (currentUser.role == 'ASM') {
      const filterValue = this.pos_uuid.nativeElement.value.toLowerCase();
      this.isload = true;
      this.posVenteService.getAllByASM(currentUser.province_uuid).subscribe(res => {
        this.posList = res.data;
        const posUuidsInCurrentDataList = this.dataListItem.map(item => item.pos_uuid);
        this.posListFilter = this.posList.filter(pos => pos.uuid && !posUuidsInCurrentDataList.includes(pos.uuid));
        this.filteredOptions = this.posListFilter.filter(o => o.name.toLowerCase().includes(filterValue));
        this.isload = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      const filterValue = this.pos_uuid.nativeElement.value.toLowerCase();
      this.isload = true;
      this.posVenteService.getAllBySup(currentUser.area_uuid).subscribe(res => {
        this.posList = res.data;
        const posUuidsInCurrentDataList = this.dataListItem.map(item => item.pos_uuid);
        this.posListFilter = this.posList.filter(pos => pos.uuid && !posUuidsInCurrentDataList.includes(pos.uuid));
        this.filteredOptions = this.posListFilter.filter(o => o.name.toLowerCase().includes(filterValue));
        this.isload = false;
      });
    } else if (currentUser.role == 'DR') {
      const filterValue = this.pos_uuid.nativeElement.value.toLowerCase();
      this.isload = true;
      this.posVenteService.getAllByDR(currentUser.sub_area_uuid).subscribe(res => {
        this.posList = res.data;
        const posUuidsInCurrentDataList = this.dataListItem.map(item => item.pos_uuid);
        this.posListFilter = this.posList.filter(pos => pos.uuid && !posUuidsInCurrentDataList.includes(pos.uuid));
        this.filteredOptions = this.posListFilter.filter(o => o.name.toLowerCase().includes(filterValue));
        this.isload = false;
      });
    } else if (currentUser.role == 'Cyclo') {
      const filterValue = this.pos_uuid.nativeElement.value.toLowerCase();
      this.isload = true;
      this.posVenteService.getAllByCyclo(currentUser.cyclo_uuid).subscribe(res => {
        this.posList = res.data;
        const posUuidsInCurrentDataList = this.dataListItem.map(item => item.pos_uuid);
        this.posListFilter = this.posList.filter(pos => pos.uuid && !posUuidsInCurrentDataList.includes(pos.uuid));
        this.filteredOptions = this.posListFilter.filter(o => o.name.toLowerCase().includes(filterValue));
        this.isload = false;
      });
    };


  }

  displayFn(pos: IPos): any {
    return pos && pos.name ? pos.name : '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posuuId = selectedOption.uuid;
    // Utilisez id et fullName comme vous le souhaitez
    console.log('pos_uuid:', this.posuuId);
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;

    this.fetchProducts(this.currentUser);

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
      this.routeplanService.getPaginatedBySubAreaId(currentUser.sub_area_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
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

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const wasCreatedRecently = res.data.some((plan: any) => {
          // Assuming plan.created is a string, number (timestamp), or Date object
          if (plan.created) {
            const createdDate = new Date(plan.created);
            // Check if createdDate is a valid date and if it's after twentyFourHoursAgo
            return !isNaN(createdDate.getTime()) && createdDate > twentyFourHoursAgo;
          }
          return false;
        });
        this.isRoutePlanCreatedRecently.set(wasCreatedRecently);
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

  // Get All routeplamitems
  getAllRoutePlanItems(value: string) {
    this.isLoadingDataItem = true;
    this.uuidRoutePlanItem = value;
    this.routePlanItemService.getAllById(this.uuidRoutePlanItem).subscribe((res) => {
      this.dataListItem = res.data;
      console.log("dataListItem", this.dataListItem);
      this.isLoadingDataItem = false;
    });
  }

  // Get value RoutePlan api
  findValue(value: any) {
    this.uuidItem = value;
    this.routeplanService.get(this.uuidItem).subscribe(item => {
      this.dataItem = item.data;
      this.routePlanItemService.refreshDataList$.subscribe(() => {
        this.getAllRoutePlanItems(this.dataItem.uuid!);
      });
      this.getAllRoutePlanItems(this.dataItem.uuid!);
      this.getAllPos(this.currentUser);
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


  // Get value RoutePlanItem api
  findValueItem(value: string) {
    this.uuidRoutePlanItem = value;
    this.routePlanItemService.get(this.uuidRoutePlanItem).subscribe(item => {
      this.dataRoutePlanItem = item.data;
      this.formGroup.patchValue({
        routeplan_uuid: this.dataRoutePlanItem.routeplan_uuid,
        pos_uuid: this.dataRoutePlanItem.pos_uuid,
        status: this.dataRoutePlanItem.status,
      });
    });
  }

  // Create new RoutePlan
  onSubmit() {
    try {
      this.isLoading = true;
      var body: IRoutePlan = {
        country_uuid: this.currentUser.country_uuid,
        province_uuid: this.currentUser.province_uuid,
        area_uuid: this.currentUser.area_uuid,
        subarea_uuid: this.currentUser.sub_area_uuid,
        commune_uuid: this.currentUser.commune_uuid,
        user_uuid: this.currentUser.uuid,
        signature: this.currentUser.fullname,
      };
      this.routeplanService.create(body).subscribe({
        next: (res) => {
          this.dataItem = res.data;
          this.logActivity.activity(
            'RoutePlan',
            this.currentUser.uuid,
            'created',
            `Create RoutePlan uuid: ${body.uuid}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
              this.toastr.success('Ajouter avec succès!', 'Success!');
              this.isLoading = false;
            }, error: (err) => {
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
          routeplan_uuid: this.dataItem.uuid!,
          pos_uuid: this.posuuId,
          status: false,
        };
        this.routePlanItemService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'RoutePlanItem',
              this.currentUser.uuid,
              'created',
              `Create RoutePlanItem uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.formGroup.reset();
                this.pos_uuid.nativeElement.value = ''; // Reset the input field
                this.toastr.success('POS Ajouter avec succès!', 'Success!');
                this.isLoadingItem = false;
              }, error: (err) => {
                this.isLoadingItem = false;
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: (err) => {
            this.isLoadingItem = false;
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoadingItem = false;
      console.log(error);
    }
  }

  onSubmitUpdateItem() {
    try {
      if (this.formGroup.valid) {
        this.isLoadingItem = true;
        var body: IRoutePlanItem = {
          uuid: this.dataRoutePlanItem.uuid,
          routeplan_uuid: this.dataRoutePlanItem.routeplan_uuid,
          pos_uuid: this.dataRoutePlanItem.pos_uuid,
          status: true,
        };
        this.routePlanItemService.update(this.uuidRoutePlanItem, body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'RoutePlanItem',
              this.currentUser.uuid,
              'updated',
              `Update RoutePlanItem uuid: ${body.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.toastr.success('POS Modifier avec succès!', 'Success!');
                this.isLoadingItem = false;
              }, error: (err) => {
                this.isLoadingItem = false;
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: (err) => {
            this.isLoadingItem = false;
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoadingItem = false;
      console.log(error);
    }
  }




  // Delete RoutePlan
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


  // Delete RoutePlanItem
  deleteItem(): void {
    this.routePlanItemService
      .delete(this.uuidRoutePlanItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'RoutePlanItem',
            this.currentUser.uuid,
            'deleted',
            `Delete RoutePlanItem uuid: ${this.uuidRoutePlanItem}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
              this.toastr.info('POS Supprimé avec succès!', 'Success!');
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

  isLessThan24HoursOld(created: Date): boolean {
    const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
    const currentTime = new Date().getTime();
    const createdTime = new Date(created).getTime();
    return currentTime - createdTime < twentyFourHoursInMilliseconds;
  }
}

