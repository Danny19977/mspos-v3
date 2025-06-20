import { ChangeDetectorRef, Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPos } from '../models/pos.model';
import { PosVenteService } from '../pos-vente.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { IUser } from '../../user/models/user.model';
import { IPosForm } from '../../posform/models/posform.model'; 

@Component({
  selector: 'app-pos-vente-list',
  standalone: false,
  templateUrl: './pos-vente-list.component.html',
  styleUrl: './pos-vente-list.component.scss'
})
export class PosVenteListComponent implements OnInit {
  isLoadingData = false;

  public routes = routes; 

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
  uuidItem!: string;
  dataItem!: IPos; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  posTypes: string[] = [
    'Gros',
    'Détail',
    'Mixte'
  ];


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
 

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        this.cdr.detectChanges(); // Trigger change detection

        this.posVenteService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser);
        });
        this.fetchProducts(this.currentUser);
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    }); 

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

 


  fetchProducts(currentUser: IUser) {
    if (currentUser.role == 'Manager') {
      this.posVenteService.getPaginated2(this.current_page, this.page_size, this.search,
        ).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'ASM') {
      this.posVenteService.getPaginatedByProvinceId(currentUser.province_uuid, this.current_page, this.page_size, this.search,
         
      ).subscribe(res => {
        this.dataList = res.data;
        console.log("dataList", this.dataList);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.posVenteService.getPaginatedByAreaId(currentUser.area_uuid, this.current_page, this.page_size, this.search,
        
      ).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      console.log("sub_area_uuid", currentUser.dr_uuid);
      this.posVenteService.getPaginatedBySubAreaId(currentUser.sub_area_uuid, this.current_page, this.page_size, this.search,
        
      ).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Cyclo') {
      this.posVenteService.getPaginatedByCommuneId(currentUser.uuid, this.current_page, this.page_size, this.search,
      ).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else {
      this.posVenteService.getPaginated2(this.current_page, this.page_size, this.search,
        ).subscribe(res => {
          this.dataList = res.data;
          console.log("dataList", this.dataList);
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
    }
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



  findValue(value: string) {
    this.uuidItem = value;
    this.posVenteService.get(this.uuidItem).subscribe(item => {
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
        sub_area_uuid: this.dataItem.sub_area_uuid,
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

  onSubmit() {
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
          status: true, // le status change une fois que le pos est synchronisé
          signature: this.currentUser.fullname,
          sync: false, // Indique que le POS n'est pas encore synchronisé 
        };
        this.posVenteService.create(body)
          .subscribe({
            next: (res) => {
              this.logActivity.activity(
                'POS',
                this.currentUser.uuid,
                'created',
                `Created Pos uuid: ${res.data.uuid}`,
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
        status: true, // le status change une fois que le pos est synchronisé
        signature: this.currentUser.fullname, 
        sync: false // Indique que le POS n'est pas encore synchronisé,
      };
      this.posVenteService.update(this.uuidItem, body)
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


  delete(): void {
    this.posVenteService
      .delete(this.uuidItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'POS',
            this.currentUser.uuid,
            'deleted',
            `Delete pos uuid: ${this.uuidItem}`,
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

