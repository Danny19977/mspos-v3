import { Component, Input, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPos } from '../../pos-vente/models/pos.model';
import { PosVenteService } from '../../pos-vente/pos-vente.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { IUser } from '../models/user.model';
import { IPosForm } from '../../posform/models/posform.model';

@Component({
  selector: 'app-pos-user-list',
  standalone: false,
  templateUrl: './pos-user-list.component.html',
  styleUrls: ['./pos-user-list.component.scss']
})
export class PosUserListComponent implements OnInit {
  @Input() userUuid!: string;
  
  isLoadingData = false;
  public routes = routes;

  // Table 
  dataList: IPos[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
  displayedColumns: string[] = [
    'status',
    'postype',
    'name',
    'shop',
    'gerant',
    'quartier',
    'avenue',
    'telephone',
    'commune',
    'posforms',
    'action'
  ];
  dataSource = new MatTableDataSource<IPos>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';
  currentUser!: IUser;

  constructor(
    private router: Router,
    private authService: AuthService,
    private posVenteService: PosVenteService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
  }

  ngOnInit() {
    this.isLoadingData = true;
    
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cdr.detectChanges();

        this.fetchUserPos();
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }

  fetchUserPos() {
    this.isLoadingData = true;
    this.posVenteService.getPaginatedByCommuneId(this.userUuid, this.current_page, this.page_size, this.search).subscribe((res: any) => {
      // Filtrer les POS par utilisateur
      this.dataList = res.data.data; 
      
      this.total_records = this.dataList.length;
      this.total_pages = Math.ceil(this.total_records / this.page_size);
      
      this.dataSource.data = this.dataList;
      this.isLoadingData = false;
      this.cdr.detectChanges();
    });
  }

  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }

  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.fetchUserPos();
  }

  onView(id: string) {
    this.router.navigate(['/pos-vente', id, 'view']);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
