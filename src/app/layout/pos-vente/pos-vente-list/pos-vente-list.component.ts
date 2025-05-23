import { ChangeDetectorRef, Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPos } from '../models/pos.model';
import { PosVenteService } from '../pos-vente.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { IUser } from '../../user/models/user.model';
import { db } from '../../../shared/services/db';
import { IPosForm } from '../../posform/models/posform.model'; 
import { formatDate } from '@angular/common'; 

@Component({
  selector: 'app-pos-vente-list',
  standalone: false,
  templateUrl: './pos-vente-list.component.html',
  styleUrl: './pos-vente-list.component.scss'
})
export class PosVenteListComponent implements OnInit {
  isLoadingData = false;

  public routes = routes;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;
  rangeDate: any[] = [];

  // Table 
  dataList: IPos[] = [];
  dataListLocal: IPos[] = [];

  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
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
    'posforms',
    'action'
  ];
  dataSource = new MatTableDataSource<IPos>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IPos; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  posTypes: string[] = [
    'Gros',
    'Détail',
    'Mixte'
  ];

  onLine = signal<boolean>(false);
  isOnline = computed(() => navigator.onLine);
  // isOnlineStatus = computed(() => this.isOnline() ? 'En ligne' : 'Hors ligne'); 


  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posVenteService: PosVenteService,
    private logActivity: LogsService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private toastr: ToastrService
  ) {
  }



  ngOnInit() {
    this.isLoadingData = true;
    this.formGroup = this._formBuilder.group({
      name: ['', Validators.required],
      shop: ['', Validators.required],
      postype: ['', Validators.required],
      gerant: ['', Validators.required],
      avenue: ['', Validators.required],
      quartier: ['', Validators.required],
      reference: ['', Validators.required],
      telephone: ['', Validators.required],
      // status: ['', Validators.required],
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
        console.log("currentUser", this.currentUser);
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        this.cdr.detectChanges(); // Trigger change detection

        if (this.isOnline()) {
          this.posVenteService.refreshDataList$.subscribe(() => {
            this.fetchProducts(this.currentUser);
          });
          this.fetchProducts(this.currentUser);
        }

        this.fecthlocalData();
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });

    // Appel de la méthode onChanges
    this.onChanges();

    // this.onLine = navigator.onLine;

  }

  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;

    this.fetchProducts(this.currentUser);
  }

  // Méthode onChanges
  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      if (this.onLine()) {
        this.fetchProducts(this.currentUser);
      }
      this.fecthlocalData();
    });
  }



  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.posVenteService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'ASM') {
      this.posVenteService.getPaginatedRangeDateByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date
      ).subscribe(res => {
        this.dataList = res.data;
        console.log("dataList", this.dataList);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.posVenteService.getPaginatedRangeDateByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date
      ).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      this.posVenteService.getPaginatedRangeDateBySubAreaId(currentUser.subarea_uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date
      ).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Cyclo') {
      this.posVenteService.getPaginatedRangeDateByCommuneId(currentUser.cyclo_uuid, this.current_page, this.page_size, this.search,
        this.start_date, this.end_date
      ).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.posVenteService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        this.start_date, this.end_date).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
    }
  }


  fecthlocalData() {
    db.pos.toArray().then((data) => {
      const dataLocallist = data;

      this.dataListLocal = dataLocallist.filter((item: IPos) => item.status == false);

      if (this.dataListLocal.length > 0 && navigator.onLine) {
        this.dataListLocal.forEach((item: IPos) => {
          var body: IPos = {
            name: item.name,
            shop: item.shop,
            postype: item.postype,
            gerant: item.gerant,
            avenue: item.avenue,
            quartier: item.quartier,
            reference: item.reference,
            telephone: item.telephone,
            country_uuid: item.country_uuid,
            province_uuid: item.province_uuid,
            area_uuid: item.area_uuid,
            subarea_uuid: item.subarea_uuid,
            commune_uuid: item.commune_uuid,
            user_uuid: item.user_uuid,
            asm_uuid: item.asm_uuid,
            sup_uuid: item.sup_uuid,
            dr_uuid: item.dr_uuid,
            cyclo_uuid: item.cyclo_uuid,
            status: true, // le status change une fois que le pos est synchronisé
            signature: item.signature,
            CreatedAt: item.CreatedAt,
            UpdatedAt: item.UpdatedAt,
          };
          this.posVenteService.create(body).subscribe({
            next: (res) => {
              db.pos.delete(item.id!).then(() => {
                // this.toastr.info('Supprimé avec succès!', 'Success!');
                this.logActivity.activity(
                  'POS',
                  this.currentUser.uuid,
                  'created',
                  `Created new pos uuid: ${res.data.uuid}`,
                  this.currentUser.fullname
                ).subscribe({
                  next: () => {
                    this.fetchProducts(this.currentUser);
                    // this.toastr.success(`Synchronisation effectuée avec succès! ${item.id!}`, 'Success!'); 
                  },
                  error: (err) => {
                    this.toastr.error(`${err.error.message}`, 'Oupss!');
                    console.log(err);
                  }
                });
              }).catch((error) => {
                console.error('Error deleting item from Dexie DB:', error);
              });
            },
            error: (err) => {
              this.isLoading = false;
              this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
              console.log(err);
            }
          });
        });
      }
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


  async onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;

        var body: IPos = {
          name: this.formGroup.value.name,
          shop: this.formGroup.value.shop,
          postype: this.formGroup.value.postype,
          gerant: this.formGroup.value.gerant,
          avenue: this.formGroup.value.avenue,
          quartier: this.formGroup.value.quartier,
          reference: this.formGroup.value.reference,
          telephone: this.formGroup.value.telephone,
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
          asm_uuid: this.currentUser.Asm.user_uuid!,
          sup_uuid: this.currentUser.Sup.user_uuid!,
          dr_uuid: this.currentUser.Dr.user_uuid!,
          cyclo_uuid: this.currentUser.Cyclo.user_uuid!,
          status: false, // le status change une fois que le pos est synchronisé
          signature: this.currentUser.fullname,
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
        };
        db.pos.add(body).then(() => {
          this.fecthlocalData();
          this.isLoading = false;
          this.formGroup.reset();
          this.toastr.success('Ajouter avec succès!', 'Success!');
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
      var body: IPos = {
        name: this.formGroup.value.name,
        shop: this.formGroup.value.shop,
        postype: this.formGroup.value.postype,
        gerant: this.formGroup.value.gerant,
        avenue: this.formGroup.value.avenue,
        quartier: this.formGroup.value.quartier,
        reference: this.formGroup.value.reference,
        telephone: this.formGroup.value.telephone,
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
        asm_uuid: this.currentUser.Asm.user_uuid!,
        sup_uuid: this.currentUser.Sup.user_uuid!,
        dr_uuid: this.currentUser.Dr.user_uuid!,
        cyclo_uuid: this.currentUser.Cyclo.user_uuid!,
        status: false, // le status change une fois que le pos est synchronisé
        signature: this.currentUser.fullname,
        UpdatedAt: new Date(),
      };
      this.posVenteService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'POS',
              this.currentUser.uuid,
              'updated',
              `Updated Pos uuid: ${res.data.uuid}`,
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

  findValue(value: string) {
    this.idItem = value;
    this.posVenteService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        name: this.dataItem.name,
        shop: this.dataItem.shop,
        postype: this.dataItem.postype,
        gerant: this.dataItem.gerant,
        avenue: this.dataItem.avenue,
        quartier: this.dataItem.quartier,
        reference: this.dataItem.reference,
        telephone: this.dataItem.telephone,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        subarea_uuid: this.dataItem.subarea_uuid,
        commune_uuid: this.dataItem.commune_uuid,
        user_uuid: this.dataItem.user_uuid,
        asm_uuid: this.dataItem.asm_uuid,
        sup_uuid: this.dataItem.sup_uuid,
        dr_uuid: this.dataItem.dr_uuid,
        cyclo_uuid: this.dataItem.cyclo_uuid,
        status: this.dataItem.status,
      });
    });
  }

  delete(): void {
    this.posVenteService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'POS',
            this.currentUser.uuid,
            'deleted',
            `Delete pos id: ${this.idItem}`,
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

}

