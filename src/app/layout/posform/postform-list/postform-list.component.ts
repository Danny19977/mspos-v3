import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { GeolocationService } from '@ng-web-apis/geolocation';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPosForm } from '../models/posform.model';
import { PosformService } from '../posform.service';
import { IUser } from '../../user/models/user.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { formatDate } from '@angular/common';
import { IRoutePlanItem } from '../../routeplan/models/routeplanItem.model';
// import { v4 as uuidv4 } from 'uuid';
import { BrandService } from '../../brand/brand.service';
import { IBrand } from '../../brand/models/brand.model';
import { IPosFormItem } from '../models/posform_item.model';
import { PosformItemService } from '../posformitem.service';
import { RouteplanService } from '../../routeplan/routeplan.service';
import { IRoutePlan } from '../../routeplan/models/routeplan.model';
import { RouteplanItemService } from '../../routeplan/routeplanitem.service';


@Component({
  selector: 'app-postform-list',
  standalone: false,
  templateUrl: './postform-list.component.html',
  styleUrl: './postform-list.component.scss'
})
export class PostformListComponent implements OnInit, AfterViewInit {
  isLoadingData = false;
  public routes = routes;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;
  rangeDate: any[] = [];

  dataList: IPosForm[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
  // Table
  displayedColumns: string[] = [
    'createdat',
    'pos',
    'country',
    'province',
    'area',
    'subarea',
    'commune',
    'price',
    'asm',
    'sup',
    'dr',
    'cyclo',
    'brand',
    'comment',
    'action'
  ];
  dataSource = new MatTableDataSource<IPosForm>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms posform
  uuidItem: string = ''; // UUID of the item to be edited or deleted
  dataItem!: IPosForm; // Single data 

  // posformItem
  uuidPosformItem: string = ''; // UUID of the posformitem to be edited or deleted
  dataPosformItem!: IPosFormItem; // Single data

  // PosFormItem list
  dataListPosFormItem: IPosFormItem[] = [];


  // FormGroup for the main form posform
  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  // FormGroup for the posformitem
  formGroupPosFormItem!: FormGroup;
  isLoadingPosFormItem = false;

  // Geolocation
  latitude!: number;
  longitude!: number;

  priceList: string[] = ['50', '100', '150', '200'];

  // Get single Routeplan
  routePlan!: IRoutePlan;
  routePlanItemList: IRoutePlanItem[] = [];
  routePlanItemListFilter: IRoutePlanItem[] = [];
  filteredOptions: IRoutePlanItem[] = [];

  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  isload = false;
  posUUID: string = '';
  posName: string = '';

  // Liste brands
  brandList: IBrand[] = [];
  brandListFilter: IBrand[] = [];
  filteredOptionBrand: IBrand[] = [];
  isLoadingBrand = false;

  @ViewChild('brand_uuid') brand_uuid!: ElementRef<HTMLInputElement>;
  isloadBrand = false;
  brandUUID: string = '';
  brandName: string = '';


  constructor(
    private readonly geolocation$: GeolocationService,
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posformService: PosformService,
    private posformItemService: PosformItemService,
    private brandService: BrandService,
    private routePlanService: RouteplanService,
    private routePlanItemService: RouteplanItemService,
    private logActivity: LogsService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {

    this.geolocation$.subscribe((position) => {
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
      console.log('Latitude:', this.latitude, 'Longitude:', this.longitude);
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
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource 
        this.cdr.detectChanges(); // Trigger change detection

        this.posformService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser, this.start_date, this.end_date);
        });
        this.fetchProducts(this.currentUser, this.start_date, this.end_date);

        this.onChanges();

        this.geolocation$.subscribe((position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          // console.log('Latitude:', position.coords.latitude);
          // console.log('Longitude:', position.coords.longitude);
        });



        this.getAllRoutePlans();
        this.getAllBrand();

      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });

  }

  ngOnInit() {
    this.isLoadingData = true;

    this.formGroup = this._formBuilder.group({
      pos_uuid: ['', Validators.required],
      price: ['', Validators.required],
      comment: ['Rien à signaler', Validators.required],
    });

    this.formGroupPosFormItem = this._formBuilder.group({
      number_farde: ['', Validators.required],
      sold: ['0', Validators.required],
    });
  }

  // Pour obtenir la liste des pos pour le plan de route
  getAllRoutePlans(): void {
    const filterValue = this.pos_uuid?.nativeElement.value.toLowerCase() || '';
    this.isload = true;

    this.routePlanService.getByUserUUID(this.currentUser.uuid).subscribe({
      next: (res) => {
        this.routePlan = res.data;
        this.routePlanItemService.getAllById(this.routePlan.uuid!).subscribe({
          next: (r) => {
            this.routePlanItemList = r.data;
            this.routePlanItemListFilter = this.routePlanItemList.filter(pos => pos.uuid && pos.status == false);
            this.filteredOptions = this.routePlanItemListFilter.filter(o => o.Pos!.name.toLowerCase().includes(filterValue));
            this.isload = false;
          },
          error: (error) => {
            this.isload = false;
            console.error('Error fetching route plan items:', error);
            this.toastr.error('Erreur lors de la récupération des plans de route.', 'Oupss!');
          }
        });
      },
      error: (error) => {
        this.isload = false;
        console.error('Error fetching route plans:', error);
        this.toastr.error('Erreur lors de la récupération des plans de route.', 'Oupss!');
      }
    });
  }

  displayFn(item: IRoutePlanItem): any {
    return item && item.Pos!.name ? item.Pos!.name : '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posUUID = selectedOption.pos_uuid;
    this.posName = selectedOption.pos_name;
  }

  // Pour obtenir la liste des marques visitées
  getAllBrand(): void {
    const filterValue = this.brand_uuid?.nativeElement.value.toLowerCase();
    this.isloadBrand = true;

    this.brandService.getAllByASM(this.currentUser.province_uuid).subscribe({
      next: (res) => {
        this.brandList = res.data;
        const posUuidsInCurrentDataList = this.dataListPosFormItem.map(item => item.brand_uuid);
        this.brandListFilter = this.brandList.filter(brand => brand.uuid && !posUuidsInCurrentDataList.includes(brand.uuid));
        this.filteredOptionBrand = this.brandListFilter.filter(o => o.name!.toLowerCase().includes(filterValue));
        this.isloadBrand = false;
      },
      error: (error) => {
        this.isloadBrand = false;
        console.error('Error fetching brand items:', error);
        this.toastr.error('Erreur lors de la récupération des marques.', 'Oupss!');
      }
    });
  }

  displayFnBrand(brand: IBrand): any {
    return brand && brand.name ? brand.name : '';
  }

  optionSelectedBrand(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.brandUUID = selectedOption.uuid;
    this.brandName = selectedOption.name;

    // Utilisez id et fullName comme vous le souhaitez
    console.log('brand_uuid:', this.brandUUID);
  }


  // Méthode onChanges
  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');


      this.fetchProducts(this.currentUser, this.start_date, this.end_date);

    });
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;

    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
  }

  fetchProducts(currentUser: IUser, start_date: string, end_date: string): void {
    if (currentUser.role == 'Manager') {
      this.posformService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'ASM') {
      this.posformService.getPaginatedRangeDateByProvinceId(
        currentUser.province_uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'Supervisor') {
      this.posformService.getPaginatedRangeDateByAreaId(
        currentUser.area_uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'DR') {
      this.posformService.getPaginatedRangeDateBySubAreaId(
        currentUser.dr_uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'Cyclo') {
      this.posformService.getPaginatedRangeDateByCommuneId(
        currentUser.uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          console.log('Data List:', this.dataList);
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data

          this.isLoadingData = false;
        });
    } else {
      this.posformService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data

          this.isLoadingData = false;
        });
    }
  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
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

  // PosFormItem Local
  getAllPosFormItem(uuid: string) {
    this.isLoadingPosFormItem = true;
    this.posformItemService.getAllById(uuid).subscribe({
      next: (res) => {
        this.dataListPosFormItem = res.data;
        console.log('PosFormItem List:', this.dataListPosFormItem);
        this.isLoadingPosFormItem = false;
      }, error: (err) => {
        this.isLoadingPosFormItem = false;
        this.toastr.error(`${err.error.message}`, 'Oupss!');
        console.log(err);
      }
    });
  }


  async onSubmitInit() {
    this.isLoading = true;
    var body: IPosForm = {
      // uuid: uuidv4(),
      price: 50,
      comment: 'Rien á signaler',
      latitude: this.latitude,
      longitude: this.longitude,
      pos_uuid: '', // This will be set later
      country_uuid: this.currentUser.country_uuid || '',
      province_uuid: this.currentUser.province_uuid || '',
      area_uuid: this.currentUser.area_uuid || '',
      sub_area_uuid: this.currentUser.sub_area_uuid || '',
      commune_uuid: this.currentUser.commune_uuid || '',
      asm_uuid: this.currentUser.asm_uuid || '',
      asm: this.currentUser.asm || '',
      sup_uuid: this.currentUser.sup_uuid || '',
      sup: this.currentUser.sup || '',
      dr_uuid: this.currentUser.dr_uuid || '',
      dr: this.currentUser.dr || '',
      cyclo_uuid: this.currentUser.cyclo_uuid || '',
      cyclo: this.currentUser.cyclo || '',
      user_uuid: this.currentUser.uuid,
      signature: this.currentUser.fullname, // Added signature property
      sync: true,
    };
    console.log('Body:', body);
    this.posformService.create(body).subscribe({
      next: (res) => {
        this.logActivity.activity(
          'PosForm',
          this.currentUser.uuid,
          'created',
          `Created Posform uuid: ${res.data.uuid!}`, // 
          this.currentUser.fullname
        ).subscribe({
          next: () => {
            this.formGroup.reset();
            this.toastr.success('Ajouter avec succès!', 'Success!');
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
        console.log(err);
        this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body: IPosForm = {
          price: parseInt(this.formGroup.value.price),
          comment: this.formGroup.value.comment,
          // latitude: this.latitude,
          // longitude: this.longitude,
          pos_uuid: this.posUUID,
          country_uuid: this.currentUser.country_uuid,
          province_uuid: this.currentUser.province_uuid,
          area_uuid: this.currentUser.area_uuid,
          sub_area_uuid: this.currentUser.sub_area_uuid,
          commune_uuid: this.currentUser.commune_uuid,
          asm_uuid: this.currentUser.asm_uuid,
          asm: this.currentUser.asm,
          sup_uuid: this.currentUser.sup_uuid,
          sup: this.currentUser.sup,
          dr_uuid: this.currentUser.dr_uuid,
          dr: this.currentUser.dr,
          cyclo_uuid: this.currentUser.cyclo_uuid,
          cyclo: this.currentUser.cyclo,
          user_uuid: this.currentUser.uuid,
          signature: this.currentUser.fullname,
          sync: false,
        };
        this.posformService.update(this.uuidItem, body)
          .subscribe({
            next: (res) => {
              this.routePlanItemService.updatePosStatus(res.data.pos_uuid, { status: true })
                .subscribe({
                  next: () => {
                    this.logActivity.activity(
                      'PosForm',
                      this.currentUser.uuid,
                      'Created',
                      `Created Posform uuid: ${res.data.uuid}`,
                      this.currentUser.fullname
                    ).subscribe({
                      next: () => {
                        this.findValue(this.uuidItem);
                        this.formGroup.reset();
                        this.toastr.success('Ajouts enregistré!', 'Success!');
                        this.isLoading = false;
                      },
                      error: (err) => {
                        this.isLoading = false;
                        this.toastr.error(`${err.error.message}`, 'Oupss!');
                        console.log(err);
                      }
                    });

                  },
                  error: (err) => {
                    this.isLoading = false;
                    this.toastr.error(`${err.error.message}`, 'Oupss!');
                    console.log(err);
                  }
                });

            },
            error: err => {
              console.log(err);
              this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
              this.isLoading = false;
            }
          });
      }
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  onSubmitUpdate() {
    try {
      this.isLoading = true;
      var body: IPosForm = {
        price: parseInt(this.formGroup.value.price),
        comment: this.formGroup.value.comment,
        // latitude: this.latitude,
        // longitude: this.longitude,
        pos_uuid: this.posUUID,
        country_uuid: this.currentUser.country_uuid,
        province_uuid: this.currentUser.province_uuid,
        area_uuid: this.currentUser.area_uuid,
        sub_area_uuid: this.currentUser.sub_area_uuid,
        commune_uuid: this.currentUser.commune_uuid,
        asm_uuid: this.currentUser.asm_uuid,
        asm: this.currentUser.asm,
        sup_uuid: this.currentUser.sup_uuid,
        sup: this.currentUser.sup,
        dr_uuid: this.currentUser.dr_uuid!,
        dr: this.currentUser.dr,
        cyclo_uuid: this.currentUser.cyclo_uuid,
        cyclo: this.currentUser.cyclo,
        user_uuid: this.currentUser.uuid,
        signature: this.currentUser.fullname,
        sync: false, // Default value for 'sync', adjust as needed 
      };
      console.log('Body:', body);
      this.posformService.update(this.uuidItem, body)
        .subscribe({
          next: (res) => {
            this.routePlanItemService.updatePosStatus(res.data.pos_uuid, { status: true })
              .subscribe({
                next: () => {
                  this.logActivity.activity(
                    'PosForm',
                    this.currentUser.uuid,
                    'updated',
                    `Updated Posform uuid: ${res.data.uuid}`,
                    this.currentUser.fullname
                  ).subscribe({
                    next: () => {
                      this.findValue(res.data.uuid!);
                      this.formGroup.reset();
                      this.toastr.success('Modification enregistré!', 'Success!');
                      this.isLoading = false;
                    },
                    error: (err) => {
                      this.isLoading = false;
                      this.toastr.error(`${err.error.message}`, 'Oupss!');
                      console.log(err);
                    }
                  });
                },
                error: (err) => {
                  this.isLoading = false;
                  this.toastr.error(`${err.error.message}`, 'Oupss!');
                  console.log(err);
                }
              });



          },
          error: err => {
            console.log(err);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            this.isLoading = false;
          }
        });
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }


  // PosformItem 
  onSubmitItem() {
    if (this.formGroupPosFormItem.valid) {
      this.isLoadingPosFormItem = true;
      var body: IPosFormItem = {
        // uuid: uuidv4(),
        posform_uuid: this.dataItem.uuid!, // Add the missing property
        brand_uuid: this.brandUUID,
        brand_name: this.brandName,
        number_farde: parseInt(this.formGroupPosFormItem.value.number_farde),
        counter: 1,
        sold: parseInt(this.formGroupPosFormItem.value.sold),
      };
      console.log('Body PosFormItem:', body);

      this.posformItemService.create(body).subscribe({
        next: (res) => {
          this.logActivity.activity(
            'PosFormItem',
            this.currentUser.uuid,
            'created',
            `Created PosformItem uuid: ${res.data.uuid}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
              this.findValue(this.dataItem.uuid!);
              this.formGroupPosFormItem.reset();
              this.toastr.success('Ajouter avec succès!', 'Success!');
              this.isLoadingPosFormItem = false;
            },
            error: (err) => {
              this.isLoadingPosFormItem = false;
              this.toastr.error(`${err.error.message}`, 'Oupss!');
              console.log(err);
            }
          });
        }, error: err => {
          console.log(err);
          this.isLoadingPosFormItem = false;
          this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
        }
      });
    }
  }

  findValue(value: string) {
    this.uuidItem = value;
    this.posformService.get(this.uuidItem).subscribe(item => {
      this.dataItem = item.data;
      console.log('Data Item:', this.dataItem);
      this.getAllPosFormItem(this.dataItem.uuid!);
      this.formGroup.patchValue({
        price: this.dataItem.price,
        comment: this.dataItem.comment,
        latitude: this.dataItem.latitude,
        longitude: this.dataItem.longitude,
        pos_uuid: this.dataItem.pos_uuid,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        sub_area_uuid: this.dataItem.sub_area_uuid,
        asm_uuid: this.dataItem.asm_uuid,
        asm: this.dataItem.asm,
        sup_uuid: this.dataItem.sup_uuid,
        sup: this.dataItem.sup,
        dr_uuid: this.dataItem.dr_uuid,
        dr: this.dataItem.dr,
        cyclo_uuid: this.dataItem.cyclo_uuid,
        cyclo: this.dataItem.cyclo,
        user_uuid: this.dataItem.user_uuid,
      });
    });
  }



  delete(): void {
    this.routePlanItemService.updatePosStatus(this.dataItem.pos_uuid!, { status: false })
      .subscribe({
        next: () => {
          this.posformService
            .delete(this.uuidItem)
            .subscribe({
              next: () => {
                this.logActivity.activity(
                  'Posform',
                  this.currentUser.uuid,
                  'deleted',
                  `Delete posform uuid: ${this.uuidItem}`,
                  this.currentUser.fullname
                ).subscribe({
                  next: () => {
                    this.formGroup.reset();
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
                this.isLoading = false;
                this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                console.log(err);
              }
            });
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error(`${err.error.message}`, 'Oupss!');
          console.log(err);
        }
      });
  }

  deletePosFormItem(uuid: string): void {
    this.isLoadingPosFormItem = true;
    this.posformItemService.delete(uuid).subscribe({
      next: () => {
        this.logActivity.activity(
          'PosFormItem',
          this.currentUser.uuid,
          'deleted',
          `Delete posformItem uuid: ${uuid}`,
          this.currentUser.fullname
        ).subscribe({
          next: () => {
            this.formGroupPosFormItem.reset();
            this.toastr.info('Supprimé avec succès!', 'Success!');
            this.isLoadingPosFormItem = false;
            this.getAllPosFormItem(this.dataItem.uuid!);
          },
          error: (err) => {
            this.isLoadingPosFormItem = false;
            this.toastr.error(`${err.error.message}`, 'Oupss!');
            console.log(err);
          }
        });
      }, error: err => {
        console.log(err);
        this.isLoadingPosFormItem = false;
        this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
      }
    });
  }


  isLessThan24HoursOld(created: Date): boolean {
    const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
    const currentTime = new Date().getTime();
    const createdTime = new Date(created).getTime();
    return currentTime - createdTime < twentyFourHoursInMilliseconds;
  }

}
