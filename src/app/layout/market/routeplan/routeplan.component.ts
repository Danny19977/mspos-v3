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
import { PosVenteService } from '../pos-vente/pos-vente.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly posVenteService = inject(PosVenteService);
  private readonly logActivity = inject(LogsService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoadingData = signal(false);
  readonly isLoadingDataItem = signal(false);
  public routes = routes;
  readonly dataList = signal<IRoutePlan[]>([]);
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
  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  readonly isload = signal(false);
  readonly posuuId = signal('');

  readonly isRoutePlanCreatedRecently = signal<boolean>(false);

  ngOnInit() {
    this.isLoadingData.set(true);

    this.authService.user().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.currentUser.set(user);
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



  getAllPos(currentUser: IUser): void {
    const filterValue = this.pos_uuid?.nativeElement?.value || '';

    const processPosList = (posList: IPos[]) => {
      this.posList.set(posList);
      const posUuidsInCurrentDataList = this.dataListItem().map(item => item.pos_uuid);
      const filtered = this.posList().filter(pos => pos.uuid && !posUuidsInCurrentDataList.includes(pos.uuid));
      this.posListFilter.set(filtered);
      this.filteredOptions.set(filtered);
      this.isload.set(false);
    };

    this.isload.set(true);

    if (currentUser.role == 'Manager') {
      this.posVenteService.getPaginated2(1, 15, filterValue
      ).subscribe(res => {
        processPosList(res.data);
      });
    } else if (currentUser.role == 'ASM') {
      this.posVenteService.getPaginatedByProvinceId(currentUser.province_uuid, 1, 15, filterValue

      ).subscribe(res => {
        processPosList(res.data);
      });
    } else if (currentUser.role == 'Supervisor') {
      this.posVenteService.getPaginatedByAreaId(currentUser.area_uuid, 1, 15, filterValue ).subscribe(res => {
        processPosList(res.data);
      });
    } else if (currentUser.role == 'DR') {
      console.log("sub_area_uuid", currentUser.dr_uuid);
      this.posVenteService.getPaginatedBySubAreaId(currentUser.sub_area_uuid, 1, 15, filterValue).subscribe(res => {
        processPosList(res.data);
      });
    } else if (currentUser.role == 'Cyclo') {
      this.posVenteService.getPaginatedByCommuneId(currentUser.uuid, 1, 15, filterValue

      ).subscribe(res => {
        processPosList(res.data);
      });
    } else {
      this.posVenteService.getPaginated2(1, 15, filterValue).subscribe(res => {
        processPosList(res.data);
      });
    }

    // if (currentUser.role == 'Manager') {
    //   this.posVenteService.getAll().subscribe(res => {
    //     processPosList(res.data);
    //   });
    // } else if (currentUser.role == 'ASM') {
    //   this.posVenteService.getAllByASM(currentUser.province_uuid).subscribe(res => {
    //     processPosList(res.data); 
    //   });
    // } else if (currentUser.role == 'Supervisor') {
    //   this.posVenteService.getAllBySup(currentUser.area_uuid).subscribe(res => {
    //     processPosList(res.data);
    //   });
    // } else if (currentUser.role == 'DR') {
    //   this.posVenteService.getAllByDR(currentUser.sub_area_uuid).subscribe(res => {
    //     processPosList(res.data);
    //   });
    // } else if (currentUser.role == 'Cyclo') {
    //   this.posVenteService.getAllByCyclo(currentUser.cyclo_uuid).subscribe(res => {
    //     processPosList(res.data);
    //   });
    // }
  }

  displayFn(pos: IPos): any {
    return pos && pos.name ? pos.name : '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posuuId.set(selectedOption.uuid);
    console.log('pos_uuid:', this.posuuId());
  }

  onPosSearchChange() {
    this.getAllPos(this.currentUser()!);
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1);
    this.page_size.set(event.pageSize);

    this.fetchProducts(this.currentUser()!);
  }

  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.routeplanService.getPaginated2(this.current_page(), this.page_size(), this.search()).subscribe(res => {
        this.dataList.set(res.data);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource().data = res.data;
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'ASM') {
      this.routeplanService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page(), this.page_size(), this.search()).subscribe(res => {
        this.dataList.set(res.data);
        console.log("data 22 ", res.data);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource().data = res.data;
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'Supervisor') {
      this.routeplanService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page(), this.page_size(), this.search()).subscribe(res => {
        this.dataList.set(res.data);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource().data = res.data;
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'DR') {
      console.log("currentUser.sub_area_uuid", currentUser.sub_area_uuid);
      this.routeplanService.getPaginatedBySubAreaId(currentUser.sub_area_uuid, this.current_page(), this.page_size(), this.search()).subscribe(res => {
        this.dataList.set(res.data);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource().data = res.data
        this.isLoadingData.set(false);
      });
    } else if (currentUser.role == 'Cyclo') {
      this.routeplanService.getPaginatedByUserId(currentUser.uuid, this.current_page(), this.page_size(), this.search()).subscribe(res => {
        this.dataList.set(res.data);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource().data = res.data;

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const wasCreatedRecently = res.data.some((plan: any) => {
          if (plan.created) {
            const createdDate = new Date(plan.created);
            return !isNaN(createdDate.getTime()) && createdDate > twentyFourHoursAgo;
          }
          return false;
        });
        this.isRoutePlanCreatedRecently.set(wasCreatedRecently);
        this.isLoadingData.set(false);
      });
    } else {
      this.routeplanService.getPaginated2(this.current_page(), this.page_size(), this.search()).subscribe(res => {
        this.dataList.set(res.data);
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource().data = res.data;
        this.isLoadingData.set(false);
      });
    }
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

  // Get All routeplamitems
  getAllRoutePlanItems(value: string) {
    this.isLoadingDataItem.set(true);
    this.uuidRoutePlanItem.set(value);
    this.routePlanItemService.getAllById(this.uuidRoutePlanItem()).subscribe((res) => {
      this.dataListItem.set(res.data);
      console.log("dataListItem", this.dataListItem());
      this.isLoadingDataItem.set(false);
    });
  }

  // Get value RoutePlan api
  findValue(value: any) {
    this.uuidItem.set(value);
    this.routeplanService.get(this.uuidItem()).subscribe(item => {
      this.dataItem.set(item.data);
      this.routePlanItemService.refreshDataList$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.getAllRoutePlanItems(this.dataItem()!.uuid!);
        setTimeout(() => {
          this.getAllPos(this.currentUser()!);
        }, 100);
      });
      this.getAllRoutePlanItems(this.dataItem()!.uuid!);
      setTimeout(() => {
        this.getAllPos(this.currentUser()!);
      }, 100);
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


  // Get value RoutePlanItem api
  findValueItem(value: string) {
    this.uuidRoutePlanItem.set(value);
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
            next: () => {
              this.toastr.success('Ajouter avec succès!', 'Success!');
              this.isLoading.set(false);
            }, error: (err) => {
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
    } catch (error) {
      this.isLoading.set(false);
      console.log(error);
    }
  }


  // Create new RoutePlanItem
  onSubmitItem() {
    try {
      if (this.formGroup().valid) {
        this.isLoadingItem.set(true);
        var body: IRoutePlanItem = {
          routeplan_uuid: this.dataItem()!.uuid!,
          pos_uuid: this.posuuId(),
          status: false,
        };
        this.routePlanItemService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'RoutePlanItem',
              this.currentUser()!.uuid,
              'created',
              `Create RoutePlanItem uuid: ${res.data.uuid}`,
              this.currentUser()!.fullname
            ).subscribe({
              next: () => {
                this.formGroup().reset();
                this.pos_uuid.nativeElement.value = '';
                this.getAllRoutePlanItems(this.dataItem()!.uuid!);
                this.getAllPos(this.currentUser()!);
                this.toastr.success('POS Ajouter avec succès!', 'Success!');
                this.isLoadingItem.set(false);
              }, error: (err) => {
                this.isLoadingItem.set(false);
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
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
              next: () => {
                this.toastr.success('POS Modifier avec succès!', 'Success!');
                this.isLoadingItem.set(false);
              }, error: (err) => {
                this.isLoadingItem.set(false);
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
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
          this.logActivity.activity(
            'RoutePlan',
            this.currentUser()!.uuid,
            'deleted',
            `Delete RoutePlan uuid: ${this.uuidItem()}`,
            this.currentUser()!.fullname
          ).subscribe({
            next: () => {
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


  // Delete RoutePlanItem
  deleteItem(): void {
    this.routePlanItemService
      .delete(this.uuidRoutePlanItem())
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'RoutePlanItem',
            this.currentUser()!.uuid,
            'deleted',
            `Delete RoutePlanItem uuid: ${this.uuidRoutePlanItem()}`,
            this.currentUser()!.fullname
          ).subscribe({
            next: () => {
              this.getAllRoutePlanItems(this.dataItem()!.uuid!);
              this.getAllPos(this.currentUser()!);
              this.toastr.info('POS Supprimé avec succès!', 'Success!');
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

  isLessThan24HoursOld(created: Date): boolean {
    const createdDate = new Date(created);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    return createdDate >= today && createdDate <= endOfToday;
  }
}

