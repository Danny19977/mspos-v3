import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table'; 
import { routes } from '../../shared/routes/routes';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth/auth.service';
import { LogsService } from '../user-logs/logs.service';
import { CountryService } from './country.service';
import { ICountry } from './models/country.model';
import { IProvince } from '../province/models/province.model';
import { IArea } from '../areas/models/area.model';
import { IAsm } from '../asm/models/asm.model';
import { ISubArea } from '../subarea/models/subarea.model';
import { ISup } from '../sups/models/sup.model';
import { IDr } from '../dr/models/dr.model';
import { ICyclo } from '../cyclo/models/cyclo.model';
import { IPos } from '../pos-vente/models/pos.model';
import { IBrand } from '../brand/models/brand.model';
import { countryList } from '../../utils/country';
import { IUser } from '../user/models/user.model';
import { ICommune } from '../commune/models/commune.model';

@Component({
  selector: 'app-country',
  standalone: false,
  templateUrl: './country.component.html',
  styleUrl: './country.component.scss'
})
export class CountryComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: ICountry[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['name', 'province', 'area', 'subarea', 'commune', 'brand', 'pos', 'asm', 'sup', 'dr', 'cyclo', 'user', 'id'];
  dataSource = new MatTableDataSource<ICountry>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';


  // Forms  
  idItem!: string;
  dataItem!: ICountry; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  countryList: string[] = countryList;

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private countryService: CountryService,
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
        this.cdr.detectChanges(); // Trigger change detection
        
        this.countryService.refreshDataList$.subscribe(() => {
          this.fetchProducts();
        });
        this.fetchProducts();
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
      name: ['', Validators.required],
    });
  }


  getProvinceCount(province: IProvince[]): string {
    return province ? province.length > 0 ? province.length.toString() : '0' : '0';
  }
  getAreaCount(area: IArea[]): string {
    return area ? area.length > 0 ? area.length.toString() : '0' : '0';
  }
  getSubareaCount(subarea: ISubArea[]): string {
    return subarea ? subarea.length > 0 ? subarea.length.toString() : '0' : '0';
  }
  getCommuneCount(commune: ICommune[]): string {
    return commune ? commune.length > 0 ? commune.length.toString() : '0' : '0';
  }
  getAsmCount(asm: IAsm[]): string {
    return asm ? asm.length > 0 ? asm.length.toString() : '0' : '0';
  }
  getSupCount(sup: ISup[]): string {
    return sup ? sup.length > 0 ? sup.length.toString() : '0' : '0';
  }
  getDrCount(dr: IDr[]): string {
    return dr ? dr.length > 0 ? dr.length.toString() : '0' : '0';
  }
  getCycloCount(cyclo: ICyclo[]): string {
    return cyclo ? cyclo.length > 0 ? cyclo.length.toString() : '0' : '0';
  }
  getBrandCount(brand: IBrand[]): string {
    return brand ? brand.length > 0 ? brand.length.toString() : '0' : '0';
  }
  getPosCount(pos: IPos[]): string {
    return pos ? pos.length > 0 ? pos.length.toString() : '0' : '0';
  }
  getUserCount(user: IUser[]): string {
    return user ? user.length > 0 ? user.length.toString() : '0' : '0';
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts();
  }

  fetchProducts() {
    this.countryService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
      this.dataList = res.data;
      this.total_pages = res.pagination.total_pages;
      this.total_records = res.pagination.total_records;
      this.dataSource.data = this.dataList; // Update dataSource data
      this.isLoadingData = false;
    });
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


  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          name: this.formGroup.value.name.toLowerCase(),
          signature: this.currentUser.fullname,
        };
        this.countryService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Country',
              this.currentUser.uuid,
              'created',
              `Created new Country id: ${res.data.uuid}`,
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
        name: this.formGroup.value.name.toLowerCase(),
        signature: this.currentUser.fullname,
      };
      this.countryService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Country',
              this.currentUser.uuid,
              'updated',
              `Updated Country id: ${res.data.uuid}`,
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
    this.countryService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        name: this.dataItem.name,
      });
    }
    );
  }



  delete(): void {
    this.countryService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Country',
            this.currentUser.uuid,
            'deleted',
            `Delete Country id: ${this.idItem}`,
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

  compareFn(c1: ICountry, c2: ICountry): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

}
