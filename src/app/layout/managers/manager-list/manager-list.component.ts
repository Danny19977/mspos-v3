import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IProvince } from '../../province/models/province.model';
import { ManagerService } from '../manager.service';
import { IManager } from '../models/manager.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { IUser } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { ICountry } from '../../country/models/country.model';
import { CountryService } from '../../country/country.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-manager-list',
  standalone: false,
  templateUrl: './manager-list.component.html',
  styleUrl: './manager-list.component.scss'
})
export class ManagerListComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IManager[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
  displayedColumns: string[] = ['country', 'title', 'user', 'id'];
  dataSource = new MatTableDataSource<IManager>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';
  // / Forms  
  idItem!: string;
  dataItem!: IManager; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: ICountry[] = [];

  userList: IUser[] = [];
  userListFiltered: IUser[] = [];
  filteredOptions: IUser[] = [] 

  @ViewChild('user_uuid') user_uuid!: ElementRef<HTMLInputElement>;
  isload = false;
  userId = '';


  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    public managerService: ManagerService,
    private countryService: CountryService,
    private userService: UserService,
    private logActivity: LogsService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private toastr: ToastrService
  ) {
  }

  ngAfterViewInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource 
        
        
        this.managerService.refreshDataList$.subscribe(() => {
          this.fetchProducts();
        });
        this.fetchProducts();
        this.fetchUsers(this.currentUser);
         
        this.countryService.getAll().subscribe(res => {
          this.countryList = res.data;
        });

        this.cdr.detectChanges(); // Trigger change detection
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
      title: ['', Validators.required],
      country_uuid: ['', Validators.required],
      user_uuid: ['', Validators.required],
    });

  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts();
  }


  fetchProducts() {
    this.managerService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
      this.dataList = res.data;
      this.total_pages = res.pagination.total_pages;
      this.total_records = res.pagination.total_records;
      this.dataSource.data = this.dataList; // Update dataSource data

      this.isLoadingData = false;
    });
  }
 

  fetchUsers(currentUser: IUser): void { 
    const filterValue = this.user_uuid.nativeElement.value.toLowerCase();

    this.isload = true;
    this.userService.getAll().subscribe(res => {
      this.userList = res.data;
      if (currentUser.role == 'DR') {
        this.userListFiltered = this.userList.filter((v) => v.country_uuid == this.currentUser.country_uuid);
      } else {
        this.userListFiltered = this.userList;
      }
      this.filteredOptions = this.userListFiltered.filter(o => o.fullname.toLowerCase().includes(filterValue));

      this.isload = false;

    });
  }

  displayFn(user: any): any {
    return user && user.fullname ? user.fullname : '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    const user_uuid = selectedOption.uuid;
    const fullname = selectedOption.fullname;
    this.userId = user_uuid;
    console.log('user_uuid:', user_uuid);
    console.log('fullname:', fullname);
  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts();
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


  public searchData(value: string): void {
    if (value == '') {
      this.dataList = this.dataList;
    } else {
      this.dataSource.filter = value.trim().toLowerCase();
      this.dataList = this.dataSource.filteredData;
    }
  } 

  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          title: this.formGroup.value.title,
          country_uuid: this.formGroup.value.country_uuid,
          user_uuid: this.userId.toString(),
          signature: this.currentUser.fullname,
        };
        this.managerService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Manager',
              this.currentUser.uuid,
              'created',
              `Created new Manager uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.formGroup.reset();
                this.toastr.success('Ajouter avec succès!', 'Success!');
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
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
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
      var body = {
        title: this.formGroup.value.title,
        country_uuid: this.formGroup.value.country_uuid,
        user_uuid: this.userId.toString(),
        signature: this.currentUser.fullname,
      };
      this.managerService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Manager',
              this.currentUser.uuid,
              'updated',
              `Updated Manager uuid: ${res.data.uuid}`,
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
    this.managerService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        title: this.dataItem.title,
        country_uuid: this.dataItem.country_uuid,
        user_uuid: this.dataItem.user_uuid,
      });
    });
  }



  delete(): void {
    this.managerService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Manager',
            this.currentUser.uuid,
            'deleted',
            `Delete Manager id: ${this.idItem}`,
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

  compareFn(c1: IProvince, c2: IProvince): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

}
