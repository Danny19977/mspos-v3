import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, computed, signal } from '@angular/core';
import { GeolocationService } from '@ng-web-apis/geolocation';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IProvince } from '../../province/models/province.model';
import { IPosForm } from '../models/posform.model';
import { PosformService } from '../posform.service';
import { IUser } from '../../user/models/user.model';
import { IArea } from '../../areas/models/area.model';
import { ISup } from '../../sups/models/sup.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { formatDate } from '@angular/common'; 
import { db } from '../../../shared/services/db';
import { IRoutePlanItem } from '../../routeplan/models/routeplanItem.model';
import { v4 as uuidv4 } from 'uuid';
import { BrandService } from '../../brand/brand.service';
import { IBrand } from '../../brand/models/brand.model';
import { IPosFormItem } from '../models/posform_item.model';
import { PosformItemService } from '../posformitem.service';


@Component({
  selector: 'app-postform-list',
  standalone: false,
  templateUrl: './postform-list.component.html',
  styleUrl: './postform-list.component.scss'
})
export class PostformListComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;
  rangeDate: any[] = [];

  dataList: IPosForm[] = [];
  dataListLocal: IPosForm[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
  dataSource = new MatTableDataSource<IPosForm>(this.dataList);


  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IPosForm; // Single data 

  // Local
  idItemLocal!: number; // local item
  dataItemlocal!: IPosForm

  dataListPosFormItem: IPosFormItem[] = [];
  dataListLocalItem: IPosFormItem[] = [];


  formGroup!: FormGroup;

  formGroupPosFormItem!: FormGroup;
  isLoadingPosFormItem = false;

  currentUser!: IUser;
  isLoading = false;
  isLoadingBrand = false;

  latitude!: number;
  longitude!: number;

  priceList: string[] = ['50', '100', '150', '200'];


  userList: IUser[] = [];
  provinceList: IProvince[] = [];
  areaList: IArea[] = [];
  supList: ISup[] = [];

  routePlanItemList: IRoutePlanItem[] = [];
  routePlanItemListFilter: IRoutePlanItem[] = [];
  filteredOptions: IRoutePlanItem[] = [];

  brandList: IBrand[] = [];
  brandListFilter: IBrand[] = [];
  filteredOptionBrand: IBrand[] = [];

  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  isload = false;
  posUUID: string = '';
  posName: string = '';

  @ViewChild('brand_uuid') brand_uuid!: ElementRef<HTMLInputElement>;
  isloadBrand = false;
  brandUUID: string = '';
  brandName: string = '';


  onLine = signal<boolean>(false);
  isOnline = computed(() => navigator.onLine);

  constructor(
    private readonly geolocation$: GeolocationService,
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posformService: PosformService,
    private posformItemService: PosformItemService,
    private brandService: BrandService,
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

  ngOnInit() {
    this.formGroup = this._formBuilder.group({
      pos_uuid: ['', Validators.required],
      price: ['', Validators.required],
      comment: ['Rien à signaler', Validators.required],
    });

    this.formGroupPosFormItem = this._formBuilder.group({
      number_farde: ['', Validators.required],
      sold: ['0', Validators.required],
    });


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

        if (this.isOnline()) {
          this.isLoadingData = true;
          this.posformService.refreshDataList$.subscribe(() => {
            this.fetchProducts(this.currentUser);
          });
          this.fetchProducts(this.currentUser);

          this.synchronizeBrand(this.currentUser);

          this.onChanges();
        }

        this.geolocation$.subscribe((position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          // console.log('Latitude:', position.coords.latitude);
          // console.log('Longitude:', position.coords.longitude);
        });

        this.fecthlocalData();

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

  getAllRoutePlans(): void {
    const filterValue = this.pos_uuid?.nativeElement.value.toLowerCase();

    this.isload = true;
    db.posForms.toArray().then(posforms => {
      db.routePlans.orderBy('CreatedAt').last().then(lastRoutePlan => {
        db.routePlanItems
          .filter((res) => res.routplan_uuid == lastRoutePlan!.uuid!)
          .toArray()
          .then(routePlanItems => {
            // Retirer les doublons
            const localUuids = posforms.map(localItem => localItem.pos_uuid);
            this.routePlanItemList = routePlanItems.filter(item => !localUuids.includes(item.uuid!));

            this.filteredOptions = this.routePlanItemList.filter(o => o.pos_name!.toLowerCase().includes(filterValue));
            this.isload = false;
          })
          .catch(error => {
            this.isload = false;
            console.error('Error fetching route plan items:', error);
          });
      });
    });

  }

  displayFn(pos: IRoutePlanItem): any {
    return pos && pos.pos_name ? pos.pos_name : '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posUUID = selectedOption.pos_uuid;
    this.posName = selectedOption.pos_name;
  }

  getAllBrand(): void {
    const filterValue = this.brand_uuid?.nativeElement.value.toLowerCase();

    this.isloadBrand = true;

    db.posformItems.toArray().then(posformItems => {
      db.brands.toArray()
        .then(brands => {
          // this.brandList = brands;

          const localUuids = posformItems.filter(p => p.posform_uuid == this.dataItemlocal.uuid).map(localItem => localItem.brand_uuid);
          this.brandList = brands.filter(item => !localUuids.includes(item.uuid!));

          this.filteredOptionBrand = this.brandList.filter(o => o.name!.toLowerCase().includes(filterValue));
          this.isloadBrand = false;
        })
        .catch(error => {
          this.isloadBrand = false;
          console.error('Error fetching brand items:', error);
        });
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

      this.fecthlocalData();
      this.fetchProducts(this.currentUser);

    });
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;

    this.fetchProducts(this.currentUser);
  }

  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.posformService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
           this.dataSource.data = this.dataList; // Update dataSource data
          this.fecthlocalData();
          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'ASM') {
      this.posformService.getPaginatedRangeDateByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          console.log("dataList ASM", this.dataList);
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
           this.dataSource.data = this.dataList; // Update dataSource data
          this.fecthlocalData();
          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'Supervisor') {
      this.posformService.getPaginatedRangeDateByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
           this.dataSource.data = this.dataList; // Update dataSource data
          this.fecthlocalData();
          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'DR') {
      this.posformService.getPaginatedRangeDateBySubAreaId(currentUser.subarea_uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
           this.dataSource.data = this.dataList; // Update dataSource data
          this.fecthlocalData();
          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'Cyclo') {
      this.posformService.getPaginatedRangeDateByUserId(currentUser.uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
           this.dataSource.data = this.dataList; // Update dataSource data
          this.fecthlocalData();
          this.isLoadingData = false;
        });
    } else {
      this.posformService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
           this.dataSource.data = this.dataList; // Update dataSource data
          this.fecthlocalData();
          this.isLoadingData = false;
        });
    }
  }


  synchronizeBrand(currentUser: IUser) {
    this.isLoadingBrand = true;
    db.brands
      .toArray()
      .then((brandLocalList) => {
        if (currentUser.role == 'Manager' || currentUser.role == 'Support') {
          this.brandService.getAll().subscribe(res => {
            const brandList: IBrand[] = res.data;

            // Compare posLocalList and posList
            const localUuids = brandLocalList.map(localItem => localItem.uuid);
            const newItems = brandList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((brand: IBrand) => {
              const body: IBrand = {
                uuid: brand.uuid,
                name: brand.name,
                country_uuid: brand.country_uuid,
                province_uuid: brand.province_uuid,
                signature: brand.signature,
                CreatedAt: brand.CreatedAt,
                UpdatedAt: brand.UpdatedAt,
              };
              db.brands.add(body).then(() => {
                console.log('New Brand added to Dexie DB');
                this.isLoadingBrand = false;
              }).catch((error) => {
                this.isLoadingBrand = false;
                this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        } else {
          this.brandService.getAllByASM(this.currentUser.province_uuid).subscribe(res => {
            const brandList: IBrand[] = res.data;

            // Compare posLocalList and posList
            const localUuids = brandLocalList.map(localItem => localItem.uuid);
            const newItems = brandList.filter(item => !localUuids.includes(item.uuid));

            // Insert new items into local database
            newItems.forEach((brand: IBrand) => {
              const body: IBrand = {
                uuid: brand.uuid,
                name: brand.name,
                country_uuid: brand.country_uuid,
                province_uuid: brand.province_uuid,
                signature: brand.signature,
                CreatedAt: brand.CreatedAt,
                UpdatedAt: brand.UpdatedAt,
              };
              db.brands.add(body).then(() => {
                console.log('New Brand added to Dexie DB');
                this.isLoadingBrand = false;
              }).catch((error) => {
                this.isLoadingBrand = false;
                this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
                console.error('Error adding item to Dexie DB:', error);
              });
            });
          });
        }
      })
      .catch((error) => {
        console.error('Error retrieving Brand with status = true from Dexie DB:', error);
      });
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

  fecthlocalData() {
    db.posForms.toArray().then((data) => {
      this.dataListLocal = data;
      const dataList = this.dataListLocal.filter((item) => item.sync === true);
      if (dataList.length > 0 && navigator.onLine) {
        dataList.forEach((item: IPosForm) => {
          var body: IPosForm = {
            uuid: item.uuid,
            price: parseInt(item.price.toString()),
            comment: item.comment,
            latitude: this.latitude.toString(), // item.latitude,
            longitude: this.longitude.toString(), // item.longitude,
            pos_uuid: item.pos_uuid,
            country_uuid: item.country_uuid,
            province_uuid: item.province_uuid,
            area_uuid: item.area_uuid,
            subarea_uuid: item.subarea_uuid,
            commune_uuid: item.commune_uuid,
            asm_uuid: item.asm_uuid,
            sup_uuid: item.sup_uuid,
            dr_uuid: item.dr_uuid,
            cyclo_uuid: item.cyclo_uuid,
            signature: item.signature,
            sync: item.sync,
            CreatedAt: item.CreatedAt,
            UpdatedAt: item.UpdatedAt,
          };
          this.posformService.create(body).subscribe((res) => {
            console.log("res POSFORM", res);
            this.logActivity.activity(
              'PosForm',
              this.currentUser.uuid,
              'created',
              `Created new PosForm uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.fetchProducts(this.currentUser);
                this.toastr.success(`Synchronisation effectuée avec succès!`, 'Success!');
                db.posForms.delete(item.id!).then(() => {
                  this.toastr.info('Supprimé avec succès!', 'Success!');
                }).catch((error) => {
                  console.error('Error deleting item from Dexie DB:', error);
                });
              },
              error: (err) => {
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          });
        });

        // Synchroniser les posformItems
        db.posformItems.toArray().then((posformItems) => {
          posformItems.forEach((posFormItem: IPosFormItem) => {
            var body: IPosFormItem = {
              uuid: posFormItem.uuid,
              posform_uuid: posFormItem.posform_uuid,
              brand_uuid: posFormItem.brand_uuid,
              number_farde: posFormItem.number_farde,
              counter: posFormItem.counter,
              sold: posFormItem.sold,
              CreatedAt: posFormItem.CreatedAt,
              UpdatedAt: posFormItem.UpdatedAt,
            };
            console.log("body POSFORMITEM", body);
            this.posformItemService.create(body).subscribe({
              next: () => {
                db.posformItems.delete(posFormItem.id!).then(() => {
                  console.log('Deleted POSFORMITEM successfully');
                }).catch((error) => {
                  console.error('Error deleting item from Dexie DB:', error);
                });
              },
              error: (err) => {
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          });
        })
      }

    });

    // liveQuery(() => db.posForms.toArray())
    //   .subscribe(data => {
    //     const startIndex = (this.current_page - 1) * this.page_size;
    //     const endIndex = startIndex + this.page_size;
    //     this.dataListLocal = data.slice(startIndex, endIndex);
    //     console.log("dataListLocal", this.dataListLocal);

    //     this.total_records = data.length;
    //     this.total_pages = Math.ceil(this.total_records / this.page_size);

    //     if (this.dataListLocal.length > 0 && navigator.onLine) {
    //       this.dataListLocal.forEach((item: IPosForm) => {
    //         if (item.sync) {
    //           var body: IPosForm = {
    //             uuid: item.uuid,
    //             price: parseInt(item.price.toString()),
    //             comment: item.comment,
    //             latitude: item.latitude,
    //             longitude: item.longitude,
    //             pos_uuid: item.pos_uuid,
    //             country_uuid: item.country_uuid,
    //             province_uuid: item.province_uuid,
    //             area_uuid: item.area_uuid,
    //             subarea_uuid: item.subarea_uuid,
    //             commune_uuid: item.commune_uuid,
    //             asm_uuid: item.asm_uuid,
    //             sup_uuid: item.sup_uuid,
    //             dr_uuid: item.dr_uuid,
    //             cyclo_uuid: item.cyclo_uuid,
    //             signature: item.signature,
    //             sold: item.sold,
    //             sync: item.sync,
    //             CreatedAt: item.CreatedAt,
    //             UpdatedAt: item.UpdatedAt,
    //           };
    //           this.posformService.create(body).subscribe({
    //             next: (res) => {
    //               this.logActivity.activity(
    //                 'PosForm',
    //                 this.currentUser.uuid,
    //                 'created',
    //                 `Created new PosForm uuid: ${res.data.uuid}`,
    //                 this.currentUser.fullname
    //               ).subscribe({
    //                 next: () => {
    //                   this.fetchProducts(this.currentUser);
    //                   this.toastr.success(`Synchronisation effectuée avec succès! ${item.id!}`, 'Success!');
    //                   db.posForms.delete(item.id!).then(() => {
    //                     this.toastr.info('Supprimé avec succès!', 'Success!');
    //                   }).catch((error) => {
    //                     console.error('Error deleting item from Dexie DB:', error);
    //                   });
    //                 },
    //                 error: (err) => {
    //                   this.toastr.error(`${err.error.message}`, 'Oupss!');
    //                   console.log(err);
    //                 }
    //               });
    //             },
    //             error: (err) => {
    //               this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
    //               console.log(err);
    //             }
    //           });

    //         }
    //       });
    //     }
    //   });
  }


  // PosFormItem Local
  getAllPosFormItem(uuid: string) {
    this.isLoadingPosFormItem = true;
    db.posformItems
      .filter((item: IPosFormItem) => item.posform_uuid === uuid)
      .toArray()
      .then((items) => {
        this.dataListLocalItem = items;
        this.isLoadingPosFormItem = false;
      })
      .catch((error) => {
        this.isLoadingPosFormItem = false;
        console.error('Error retrieving posformItems from Dexie DB:', error);
      });
  }

  // Get PosformsItem by UUId
  getPosFormItemByUUId(uuid: string) {
    this.isLoadingPosFormItem = true;
    this.posformItemService.getAllById(uuid).subscribe({
      next: (res) => {
        this.dataListPosFormItem = res.data;
        this.isLoadingPosFormItem = false;
      }, error: (err) => {
        this.isLoadingPosFormItem = false;
        this.toastr.error(`${err.error.message}`, 'Oupss!');
        console.log(err);
      }
    });
  }


  onSubmitInit() {
    var body: IPosForm = {
      uuid: uuidv4(),
      price: 50,
      comment: 'Rien á signaler',
      latitude: '0', // this.latitude.toString(),
      longitude: '0', // this.longitude.toString(),
      pos_uuid: this.posUUID,
      pos_name: this.posName,
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
      asm_uuid: this.currentUser.asm.user_uuid!,
      sup_uuid: this.currentUser.sup.user_uuid!,
      dr_uuid: this.currentUser.dr.user_uuid!,
      cyclo_uuid: this.currentUser.cyclo.user_uuid!,
      signature: this.currentUser.fullname, // Added signature property
      sync: false, // Default value for 'sync', adjust as needed
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };
    db.posForms.add(body).then((id) => {
      db.posForms.get(id).then((item) => {
        this.dataItemlocal = item!;
        this.fecthlocalData();
      });
      this.isLoading = false;
      this.formGroup.reset();
      this.toastr.success('Ajouter avec succès!', 'Success!');
    }).catch((error) => {
      console.error('Error adding item to Dexie DB:', error);
      this.isLoading = false;
      this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
    });
  }

  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body: IPosForm = {
          price: parseInt(this.formGroup.value.price),
          comment: this.formGroup.value.comment,
          latitude: '0', // this.latitude.toString(),
          longitude: '0', // this.longitude.toString(),
          pos_uuid: this.posUUID,
          pos_name: this.posName,
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
          asm_uuid: this.currentUser.asm.user_uuid!,
          sup_uuid: this.currentUser.sup.user_uuid!,
          dr_uuid: this.currentUser.dr.user_uuid!,
          cyclo_uuid: this.currentUser.cyclo.user_uuid!,
          signature: this.currentUser.fullname,
          sync: true, // Default value for 'sync', adjust as needed
          // CreatedAt: new Date(),
          UpdatedAt: new Date(),
        };
        db.posForms.update(this.dataItemlocal.id!, body).then((id) => {
          db.routePlanItems
            .where('pos_uuid')
            .equals(this.posUUID)
            .modify({ status: true })
            .then(() => {
              this.fecthlocalData();
              this.isLoading = false;
              this.formGroup.reset();
              this.toastr.success('Ajouter avec succès!', 'Success!');
            })
            .catch((error) => {
              console.error('Error updating status in Dexie DB:', error);
            });
        }).catch((error) => {
          console.error('Error adding item to Dexie DB:', error);
          this.isLoading = false;
          this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
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
        latitude: '-', // this.latitude.toString(),
        longitude: '-', // this.longitude.toString(),
        pos_uuid: this.posUUID,
        pos_name: this.posName,
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
        asm_uuid: this.currentUser.asm.uuid,
        sup_uuid: this.currentUser.sup.uuid,
        dr_uuid: this.currentUser.dr.uuid,
        cyclo_uuid: this.currentUser.cyclo.uuid,
        signature: this.currentUser.fullname,
        sync: true, // Default value for 'sync', adjust as needed
        // CreatedAt: new Date(),
        UpdatedAt: new Date(),
      };
      this.posformService.update(this.dataItem.uuid!, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'PosForm',
              this.currentUser.uuid,
              'updated',
              `Updated Posform uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
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
        uuid: uuidv4(),
        posform_uuid: this.dataItemlocal.uuid!, // Add the missing property
        brand_uuid: this.brandUUID,
        brand_name: this.brandName,
        number_farde: this.formGroupPosFormItem.value.number_farde,
        counter: 1,
        sold: parseInt(this.formGroupPosFormItem.value.sold),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      };
      db.posformItems.add(body).then(() => {
        this.isLoadingPosFormItem = false;
        this.formGroupPosFormItem.reset();
        this.brand_uuid.nativeElement.value = '';
        this.brandUUID = '';
        this.brandName = '';


        this.getAllPosFormItem(this.dataItemlocal.uuid!);
      }).catch((error) => {
        console.error('Error adding item to Dexie DB:', error);
        this.isLoadingPosFormItem = false;
        this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
      });
    }
  }

  findValueLocal(value: number) {
    this.idItemLocal = value;
    db.posForms.get(this.idItemLocal).then((item) => {
      this.dataItemlocal = item!;
      console.log("dataItemlocal", this.dataItemlocal);
      this.formGroup.patchValue({
        price: this.dataItemlocal.price,
        comment: this.dataItemlocal.comment,
        latitude: this.dataItemlocal.latitude,
        longitude: this.dataItemlocal.longitude,
        pos_uuid: this.dataItemlocal.pos_uuid,
        country_uuid: this.dataItemlocal.country_uuid,
        province_uuid: this.dataItemlocal.province_uuid,
        area_uuid: this.dataItemlocal.area_uuid,
        subarea_uuid: this.dataItemlocal.subarea_uuid,
        asm_uuid: this.dataItemlocal.asm_uuid,
        sup_uuid: this.dataItemlocal.sup_uuid,
        dr_uuid: this.dataItemlocal.dr_uuid,
        cyclo_uuid: this.dataItemlocal.cyclo_uuid,
      });
      console.log("dataItemlocal", this.dataItemlocal);
      this.getAllPosFormItem(this.dataItemlocal.uuid!);
    }).catch((error) => {
      console.error('Error retrieving item from Dexie DB:', error);
    });
  }


  findValue(value: string) {
    this.idItem = value;
    this.posformService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.getPosFormItemByUUId(this.dataItem.uuid!);
      this.formGroup.patchValue({
        price: this.dataItem.price,
        comment: this.dataItem.comment,
        latitude: this.dataItem.latitude,
        longitude: this.dataItem.longitude,
        pos_uuid: this.dataItem.pos_uuid,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        subarea_uuid: this.dataItem.subarea_uuid,
        asm_uuid: this.dataItem.asm_uuid,
        sup_uuid: this.dataItem.sup_uuid,
        dr_uuid: this.dataItem.dr_uuid,
        cyclo_uuid: this.dataItem.cyclo_uuid,
      });
    });
  }



  delete(): void {
    this.posformService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Posform',
            this.currentUser.uuid,
            'deleted',
            `Delete posform id: ${this.idItem}`,
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
          this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
          console.log(err);
        }
      }
      );
  }

  deletePosform(id: number): void {
    db.posForms.delete(id).then(() => {
      this.toastr.info('Supprimé avec succès!', 'Success!');
      this.isLoadingPosFormItem = false;
      this.fecthlocalData();
      this.getAllPosFormItem(this.dataItemlocal.uuid!);
    }).catch((error) => {
      console.error('Error deleting item from Dexie DB:', error);
      this.isLoadingPosFormItem = false;
      this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
    });
  }

  deletePosFormItem(id: number): void {
    this.isLoadingPosFormItem = true;
    db.posformItems.delete(id).then(() => {
      this.toastr.info('Supprimé avec succès!', 'Success!');
      this.isLoadingPosFormItem = false;
      this.getAllPosFormItem(this.dataItemlocal.uuid!);
    }).catch((error) => {
      console.error('Error deleting item from Dexie DB:', error);
      this.isLoadingPosFormItem = false;
      this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
    });
  }

}
