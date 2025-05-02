import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { routes } from '../../../shared/routes/routes';
import { IPosForm } from '../../posform/models/posform.model';
import { IUser } from '../../user/models/user.model';
import { IPos } from '../models/pos.model';
import { AuthService } from '../../../auth/auth.service';
import { PosVenteService } from '../pos-vente.service';
import { PosformService } from '../../posform/posform.service';
import { formatDate } from '@angular/common';
import { LogsService } from '../../user-logs/logs.service';


@Component({
  selector: 'app-pos-view',
  standalone: false,
  templateUrl: './pos-view.component.html',
  styleUrl: './pos-view.component.scss'
})
export class PosViewComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;

  // Table 
  dataList: IPosForm[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;
  rangeDate: any[] = [];

  // Table 
  displayedColumns: string[] = ['country', 'province', 'area', 'subarea', 'commune', 'price', 'asm', 'sup', 'dr', 'cyclo', 'brand', 'comment', 'id'];
  dataSource = new MatTableDataSource<IPosForm>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IPosForm; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  posUUID!: string;
  pos!: IPos;

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posService: PosVenteService,
    private posformService: PosformService,
    private logActivity: LogsService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private toastr: ToastrService
  ) {
  }


  ngAfterViewInit(): void {
    this.route.params.subscribe(params => {
      this.posUUID = params['uuid'];
      this.posService.get(this.posUUID).subscribe(item => {
        this.pos = item.data;
        this.authService.user().subscribe({
          next: (user) => {
            this.currentUser = user;
            this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
            this.dataSource.sort = this.sort; // Bind sort to dataSource
            this.cdr.detectChanges(); // Trigger change detection

            this.posformService.refreshDataList$.subscribe(() => {
              this.fetchProducts(this.pos.uuid!);
            });
            this.fetchProducts(this.pos.uuid!);
          },
          error: (error) => {
            this.isLoadingData = false;
            this.router.navigate(['/auth/login']);
            console.log(error);
          }
        });
      });
    });
  }


  ngOnInit() {
    this.isLoadingData = true;

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
 
  }


  // Méthode onChanges
  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      this.fetchProducts(this.posUUID);

    });
  }



  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts(this.posUUID);
  }

  fetchProducts(uuid: string) {
    this.posformService.getPaginatedRangeDateByUUID(
      uuid, this.current_page, this.page_size, this.search,
      this.start_date, this.end_date).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
  }





  onSearchChange(search: string) {
    this.search = search;
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
    this.idItem = value;
    this.posformService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
    });
  }



  delete(): void {
    this.posformService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'PosForm',
            this.currentUser.uuid,
            'deleted',
            `Delete PosForm id: ${this.idItem}`,
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

