import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../../shared/routes/routes';
import { AuthService } from '../../../../auth/auth.service';
import { SupService } from '../sup.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { IUser } from '../../../management/user/models/user.model';
import { IPos } from '../../../market/pos-vente/models/pos.model';
import { IPosForm } from '../../../market/posform/models/posform.model';
import { UserService } from '../../../management/user/user.service';

@Component({
  selector: 'app-sup-filter',
  standalone: false,
  templateUrl: './sup-filter.component.html',
  styleUrl: './sup-filter.component.scss'
})
export class SupFilterComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IUser[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['country', 'province', 'area', 'asm', 'user', 'drs', 'cyclos', 'pos', 'postforms'];
  dataSource = new MatTableDataSource<IUser>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  currentUser!: IUser;

  name: string = ''; // Variable to hold the ASM name
  team_uuid: string = ''; // Variable to hold the team UUID
  team: any; // Variable to get the team data

  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public supService: SupService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef 
    private userService: UserService,
  ) { 
  }


  ngAfterViewInit(): void {
    this.route.params.subscribe(params => {
      this.name = params['name'];
      this.team_uuid = params['uuid'];
      this.authService.user().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
          this.dataSource.sort = this.sort; // Bind sort to dataSource
          this.cdr.detectChanges();

          this.supService.refreshDataList$.subscribe(() => {
            this.fetchProducts(this.name, this.team_uuid);
          });
          this.fetchProducts(this.name, this.team_uuid);
        },
        error: (error) => {
          this.isLoadingData = false;
          this.router.navigate(['/auth/login']);
          console.log(error);
        }
      });
    });

  }

  ngOnInit() {
    this.isLoadingData = true;
  }

  // getDrCount(dr: IDr[]): string {
  //   return dr ? dr.length > 0 ? dr.length.toString() : '0' : '0';
  // }
  // getCycloCount(cyclo: ICyclo[]): string {
  //   return cyclo ? cyclo.length > 0 ? cyclo.length.toString() : '0' : '0';
  // }
  getPosCount(pos: IPos[]): string {
    return pos ? pos.length > 0 ? pos.length.toString() : '0' : '0';
  }
  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }
  getUserCount(user: IUser[]): string {
    return user ? user.length > 0 ? user.length.toString() : '0' : '0';
  }



  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts(this.name, this.team_uuid);
  }


  fetchProducts(name: string, territoire_uuid: string) {
    if (name == 'Manager') {
      this.supService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.isLoadingData = false;
      });
    } else if (name == 'ASM') {
      this.userService.get(territoire_uuid).subscribe(item => {
        this.team = item.data;
        this.supService.getPaginatedByProvinceId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
      });
    } else if (name == 'Supervisor') {
      this.userService.get(territoire_uuid).subscribe(item => {
        this.team = item.data;
        this.supService.getPaginatedByAreaId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList; // Update dataSource data
          this.isLoadingData = false;
        });
      });
    } else {
      this.supService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
        this.dataList = res.data;
        console.log(res.data);
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data

        this.isLoadingData = false;
      });
    }
  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts(this.name, this.team_uuid);
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


}
