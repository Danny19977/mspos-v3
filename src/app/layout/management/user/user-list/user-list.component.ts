import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { routes } from '../../../../shared/routes/routes';
import { UserService } from '../user.service';
import { IUser } from '../models/user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPermission, permissions } from '../../../../shared/model/permission.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service'; 
import { IProvince } from '../../../territories/province/models/province.model'; 
import { ProvinceService } from '../../../territories/province/province.service'; 
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ICountry } from '../../../territories/country/models/country.model';
import { IArea } from '../../../territories/areas/models/area.model';
import { ISubArea } from '../../../territories/subarea/models/subarea.model';
import { ICommune } from '../../../territories/commune/models/commune.model';
import { CountryService } from '../../../territories/country/country.service';
import { AreaService } from '../../../territories/areas/area.service';
import { CommuneService } from '../../../territories/commune/commune.service';
import { SubareaService } from '../../../territories/subarea/subarea.service';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit, AfterViewInit {
  isLoadingData = false;
  public routes = routes;

  // Table 
  dataList: IUser[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table 
  displayedColumns: string[] = ['status', 'fullname', 'title', 'email', 'phone', 'country', 'province', 'area', 'subarea', 'commune', 'asm', 'sup', 'dr', 'cyclo', 'uuid'];
  dataSource = new MatTableDataSource<IUser>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IUser; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  public password: boolean[] = [false];
  isStatusList: boolean[] = [false, true];
  isTitleList: string[] = [
    'Manager',
    'ASM',
    'Supervisor',
    'DR',
    'Cyclo',
    'Support'
  ];

  permissionList: IPermission[] = permissions;

  isManager = false;

  countryList: ICountry[] = [];

  provinceList: IProvince[] = [];
  provinceListFilter: IProvince[] = [];

  areaList: IArea[] = [];
  areaListFilter: IArea[] = [];

  subAreaList: ISubArea[] = [];
  subAreaListFilter: ISubArea[] = [];

  communeList: ICommune[] = [];
  communeListFilter: ICommune[] = [];


  userASMList: IUser[] = [];
  userASMListFilter: IUser[] = [];
  filteredOptionASMs: IUser[] = [];
  @ViewChild('user_asm_uuid') user_asm_uuid!: ElementRef<HTMLInputElement>;
  isloadASM = false;
  asmUserUUID: string = '';
  asmFUserullName: string = '';

  userSupList: IUser[] = [];
  userSupListFilter: IUser[] = [];
  filteredOptionSups: IUser[] = [];
  @ViewChild('user_sup_uuid') user_sup_uuid!: ElementRef<HTMLInputElement>;
  isloadSup = false;
  supUserUUID: string = '';
  supUserFullName: string = '';

  userDrList: IUser[] = [];
  userDrListFilter: IUser[] = [];
  filteredOptionDrs: IUser[] = [];
  @ViewChild('user_dr_uuid') user_dr_uuid!: ElementRef<HTMLInputElement>;
  isloadDr = false;
  drUserUUID: string = '';
  drUserFullName: string = '';

  userCycloList: IUser[] = [];
  userCycloListFilter: IUser[] = [];
  filteredOptionCyclos: IUser[] = [];
  @ViewChild('user_cyclo_uuid') user_cyclo_uuid!: ElementRef<HTMLInputElement>;
  isloadCyclo = false;
  cycloUserUUID: string = '';
  cycloUserFullName: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private usersService: UserService,
    private _formBuilder: FormBuilder,
    private logActivity: LogsService,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private areaService: AreaService,
    private subAreaService: SubareaService,
    private communeService: CommuneService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) { }

  ngAfterViewInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cdr.detectChanges();

        this.usersService.refreshDataList$.subscribe(() => {
          this.fetchProducts();
        });
        this.fetchProducts();

        this.countryService.getAll().subscribe(res => {
          this.countryList = res.data;
        });
        this.provinceService.getAll().subscribe(res => {
          this.provinceList = res.data;
        });
        this.areaService.getAll().subscribe(res => {
          this.areaList = res.data;
        });
        this.subAreaService.getAll().subscribe(res => {
          this.subAreaList = res.data;
        });
        this.communeService.getAll().subscribe(res => {
          this.communeList = res.data;
        });
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
      fullname: ['', Validators.required],
      email: [''],
      title: ['', Validators.required],
      phone: ['', Validators.required],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],
      permission: ['', Validators.required],
      status: [''],
      country_uuid: [''],
      province_uuid: [''],
      area_uuid: ['',],
      sub_area_uuid: [''],
      commune_uuid: [''],
      support_uuuid: [''],
      manager_uuid: [''],
      asm_uuid: [''],
      sup_uuid: [''],
      dr_uuid: [''],
      cyclo_uuid: [''],
    });
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.fetchProducts();
  }

  fetchProducts() {
    this.usersService.getPaginated2(this.current_page, this.page_size, this.search).subscribe(res => {
      this.dataList = res.data;
      this.total_pages = res.pagination.total_pages;
      this.total_records = res.pagination.total_records;
      this.dataSource.data = this.dataList;
      this.dataSource.sort = this.sort;
      this.isLoadingData = false;
    });
  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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

  public togglePassword(index: number) {
    this.password[index] = !this.password[index]
  }

  findValue(value: any) {
    this.idItem = value;
    this.usersService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        fullname: this.dataItem.fullname,
        email: this.dataItem.email,
        title: this.dataItem.title,
        phone: this.dataItem.phone,
        role: this.dataItem.title,
        permission: this.dataItem.permission,
        status: this.dataItem.status,
        country_uuid: this.dataItem.country_uuid,
        province_uuid: this.dataItem.province_uuid,
        area_uuid: this.dataItem.area_uuid,
        sub_area_uuid: this.dataItem.sub_area_uuid,
        commune_uuid: this.dataItem.commune_uuid,
        support_uuuid: this.dataItem.support_uuuid,
        support: this.dataItem.support,
        manager_uuid: this.dataItem.manager_uuid,
        manager: this.dataItem.manager,
        asm_uuid: this.dataItem.asm_uuid,
        asm: this.dataItem.asm,
        sup_uuid: this.dataItem.sup_uuid,
        sup: this.dataItem.sup,
        dr_uuid: this.dataItem.dr_uuid,
        dr: this.dataItem.dr,
        cyclo_uuid: this.dataItem.cyclo_uuid,
        cyclo: this.dataItem.cyclo,
      });

      // Mise à jour des listes filtrées en cascade
      this.updateCascadingDropdowns();

      // Restaurer les valeurs des autocomplete
      this.restoreAutocompleteValues();
    });
  }

  private updateCascadingDropdowns() {
    const countryUuid = this.formGroup.get('country_uuid')?.value;
    const provinceUuid = this.formGroup.get('province_uuid')?.value;
    const areaUuid = this.formGroup.get('area_uuid')?.value;
    const subAreaUuid = this.formGroup.get('sub_area_uuid')?.value;
    const communeUuid = this.formGroup.get('commune_uuid')?.value;

    if (countryUuid) {
      this.updateProvinceList(countryUuid);
    }
    if (provinceUuid) {
      this.updateAreaList(provinceUuid);
      this.getAllASMByProvince(provinceUuid);
    }
    if (areaUuid) {
      this.updateSubAreaList(areaUuid);
      this.getAllSupByArea(areaUuid);
    }
    if (subAreaUuid) {
      this.updateCommuneList(subAreaUuid);
      this.getAllDrBySubArea(subAreaUuid);
    }
    if (communeUuid) {
      this.getAllCycloByCommune(communeUuid);
    }
  }

  private restoreAutocompleteValues() {
    // Restaurer ASM
    if (this.dataItem.asm_uuid && this.dataItem.asm) {
      this.asmUserUUID = this.dataItem.asm_uuid;
      this.asmFUserullName = this.dataItem.asm;
      if (this.user_asm_uuid) {
        this.user_asm_uuid.nativeElement.value = this.dataItem.asm;
      }
    }

    // Restaurer Supervisor
    if (this.dataItem.sup_uuid && this.dataItem.sup) {
      this.supUserUUID = this.dataItem.sup_uuid;
      this.supUserFullName = this.dataItem.sup;
      if (this.user_sup_uuid) {
        this.user_sup_uuid.nativeElement.value = this.dataItem.sup;
      }
    }

    // Restaurer DR
    if (this.dataItem.dr_uuid && this.dataItem.dr) {
      this.drUserUUID = this.dataItem.dr_uuid;
      this.drUserFullName = this.dataItem.dr;
      if (this.user_dr_uuid) {
        this.user_dr_uuid.nativeElement.value = this.dataItem.dr;
      }
    }

    // Restaurer Cyclo
    if (this.dataItem.cyclo_uuid && this.dataItem.cyclo) {
      this.cycloUserUUID = this.dataItem.cyclo_uuid;
      this.cycloUserFullName = this.dataItem.cyclo;
      if (this.user_cyclo_uuid) {
        this.user_cyclo_uuid.nativeElement.value = this.dataItem.cyclo;
      }
    }
  }

  onCountryChange(event: any) {
    this.updateProvinceList(event.value);
    this.resetDependentDropdowns('country');
  }

  onProvinceChange(event: any) {
    this.updateAreaList(event.value);
    this.getAllASMByProvince(event.value);
    this.resetDependentDropdowns('province');
  }

  onAreaChange(event: any) {
    this.updateSubAreaList(event.value);
    this.getAllSupByArea(event.value);
    this.resetDependentDropdowns('area');
  }

  onSubAreaChange(event: any) {
    this.updateCommuneList(event.value);
    this.getAllDrBySubArea(event.value);
    this.resetDependentDropdowns('subarea');
  }

  onCommuneChange(event: any) {
    this.getAllCycloByCommune(event.value);
    this.resetDependentDropdowns('commune');
  }

  private updateProvinceList(countryUuid: string) {
    const provinceArray = this.provinceList.filter((v) => v.country_uuid == countryUuid);
    this.provinceListFilter = provinceArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    );
  }

  private updateAreaList(provinceUuid: string) {
    const areaArray = this.areaList.filter((v) => v.province_uuid == provinceUuid);
    this.areaListFilter = areaArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    );
  }

  private updateSubAreaList(areaUuid: string) {
    const subAreaArray = this.subAreaList.filter((v) => v.area_uuid == areaUuid);
    this.subAreaListFilter = subAreaArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    );
  }

  private updateCommuneList(subAreaUuid: string) {
    const communeArray = this.communeList.filter((v) => v.sub_area_uuid == subAreaUuid);
    this.communeListFilter = communeArray.filter((obj, index, self) =>
      index === self.findIndex((t) => t.name === obj.name)
    );
  }

  private resetDependentDropdowns(level: string) {
    switch (level) {
      case 'country':
        // Reset province and all dependent
        this.areaListFilter = [];
        this.subAreaListFilter = [];
        this.communeListFilter = [];
        this.resetAllAutocomplete();
        break;
      case 'province':
        // Reset area and all dependent
        this.subAreaListFilter = [];
        this.communeListFilter = [];
        this.resetSupDrCycloAutocomplete();
        break;
      case 'area':
        // Reset subarea and dependent
        this.communeListFilter = [];
        this.resetDrCycloAutocomplete();
        break;
      case 'subarea':
        // Reset commune and dependent
        this.resetCycloAutocomplete();
        break;
      case 'commune':
        // No dependent dropdowns for commune
        break;
    }
  }

  private resetAllAutocomplete() {
    this.filteredOptionASMs = [];
    this.filteredOptionSups = [];
    this.filteredOptionDrs = [];
    this.filteredOptionCyclos = [];
    this.clearAutocompleteInputs();
  }

  private resetSupDrCycloAutocomplete() {
    this.filteredOptionSups = [];
    this.filteredOptionDrs = [];
    this.filteredOptionCyclos = [];
    if (this.user_sup_uuid) this.user_sup_uuid.nativeElement.value = '';
    if (this.user_dr_uuid) this.user_dr_uuid.nativeElement.value = '';
    if (this.user_cyclo_uuid) this.user_cyclo_uuid.nativeElement.value = '';
    this.supUserUUID = '';
    this.supUserFullName = '';
    this.drUserUUID = '';
    this.drUserFullName = '';
    this.cycloUserUUID = '';
    this.cycloUserFullName = '';
  }

  private resetDrCycloAutocomplete() {
    this.filteredOptionDrs = [];
    this.filteredOptionCyclos = [];
    if (this.user_dr_uuid) this.user_dr_uuid.nativeElement.value = '';
    if (this.user_cyclo_uuid) this.user_cyclo_uuid.nativeElement.value = '';
    this.drUserUUID = '';
    this.drUserFullName = '';
    this.cycloUserUUID = '';
    this.cycloUserFullName = '';
  }

  private resetCycloAutocomplete() {
    this.filteredOptionCyclos = [];
    if (this.user_cyclo_uuid) this.user_cyclo_uuid.nativeElement.value = '';
    this.cycloUserUUID = '';
    this.cycloUserFullName = '';
  }

  private clearAutocompleteInputs() {
    if (this.user_asm_uuid) this.user_asm_uuid.nativeElement.value = '';
    if (this.user_sup_uuid) this.user_sup_uuid.nativeElement.value = '';
    if (this.user_dr_uuid) this.user_dr_uuid.nativeElement.value = '';
    if (this.user_cyclo_uuid) this.user_cyclo_uuid.nativeElement.value = '';
    this.asmUserUUID = '';
    this.asmFUserullName = '';
    this.supUserUUID = '';
    this.supUserFullName = '';
    this.drUserUUID = '';
    this.drUserFullName = '';
    this.cycloUserUUID = '';
    this.cycloUserFullName = '';
  }

  getAllASM(): void {
    const filterValue = this.user_asm_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadASM = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userASMList = res.data;
        this.userASMListFilter = this.userASMList.filter((u) => u.role === 'ASM');
        this.filteredOptionASMs = this.userASMListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadASM = false;
      },
      error: (error) => {
        this.isloadASM = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des ASM.', 'Oupss!');
      }
    });
  }

  getAllASMByProvince(provinceUuid: string): void {
    if (!provinceUuid) return;
    
    const filterValue = this.user_asm_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadASM = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userASMList = res.data;
        this.userASMListFilter = this.userASMList.filter((u) => 
          u.role === 'ASM' && u.province_uuid === provinceUuid
        ); 
        
        this.filteredOptionASMs = this.userASMListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadASM = false;
      },
      error: (error) => {
        this.isloadASM = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des ASM.', 'Oupss!');
      }
    });
  }

  displayFnASM(user: IUser): any {
    return user && user.fullname ? user.fullname : '';
  }

  optionSelectedASM(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    console.log('Selected ASM:', selectedOption);
    this.asmUserUUID = selectedOption.uuid;
    this.asmFUserullName = selectedOption.fullname;
  }

  getAllSup(): void {
    const filterValue = this.user_sup_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadSup = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userSupList = res.data;
        this.userSupListFilter = this.userSupList.filter((u) => u.role === 'Supervisor');
        this.filteredOptionSups = this.userSupListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadSup = false;
      },
      error: (error) => {
        this.isloadSup = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des Supervisors.', 'Oupss!');
      }
    });
  }

  getAllSupByArea(areaUuid: string): void {
    if (!areaUuid) return;

    const filterValue = this.user_sup_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadSup = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userSupList = res.data;
        this.userSupListFilter = this.userSupList.filter((u) => 
          u.role === 'Supervisor' && u.area_uuid === areaUuid
        );
        this.filteredOptionSups = this.userSupListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadSup = false;
      },
      error: (error) => {
        this.isloadSup = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des Supervisors.', 'Oupss!');
      }
    });
  }

  displayFnSup(user: IUser): any {
    return user && user.fullname ? user.fullname : '';
  }

  optionSelectedSup(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.supUserUUID = selectedOption.uuid;
    this.supUserFullName = selectedOption.fullname;
  }

  getAllDr(): void {
    const filterValue = this.user_dr_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadDr = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userDrList = res.data;
        this.userDrListFilter = this.userDrList.filter((u) => u.role === 'DR');
        this.filteredOptionDrs = this.userDrListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadDr = false;
      },
      error: (error) => {
        this.isloadDr = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des DR.', 'Oupss!');
      }
    });
  }

  getAllDrBySubArea(subAreaUuid: string): void {
    if (!subAreaUuid) return;

    const filterValue = this.user_dr_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadDr = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userDrList = res.data;
        this.userDrListFilter = this.userDrList.filter((u) => {
          const isDR = u.role === 'DR';
          const hasMatchingSubArea = u.sub_area_uuid === subAreaUuid;
          return isDR && hasMatchingSubArea;
        });
        
        this.filteredOptionDrs = this.userDrListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadDr = false;
      },
      error: (error) => {
        this.isloadDr = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des DR.', 'Oupss!');
      }
    });
  }

  displayFnDr(user: IUser): any {
    return user && user.fullname ? user.fullname : '';
  }

  optionSelectedDr(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.drUserUUID = selectedOption.uuid;
    this.drUserFullName = selectedOption.fullname;
  }

  getAllCyclo(): void {
    const filterValue = this.user_cyclo_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadCyclo = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userCycloList = res.data;
        this.userCycloListFilter = this.userCycloList.filter((u) => u.role === 'Cyclo');
        this.filteredOptionCyclos = this.userCycloListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadCyclo = false;
      },
      error: (error) => {
        this.isloadCyclo = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des Cyclos.', 'Oupss!');
      }
    });
  }

  getAllCycloByCommune(communeUuid: string): void {
    if (!communeUuid) return;

    const filterValue = this.user_cyclo_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadCyclo = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userCycloList = res.data;
        this.userCycloListFilter = this.userCycloList.filter((u) => 
          u.role === 'Cyclo' && u.commune_uuid === communeUuid
        );
        this.filteredOptionCyclos = this.userCycloListFilter.filter(o => 
          o.fullname!.toLowerCase().includes(filterValue)
        );
        this.isloadCyclo = false;
      },
      error: (error) => {
        this.isloadCyclo = false;
        console.error('Error fetching user:', error);
        this.toastr.error('Erreur lors de la récupération des Cyclos.', 'Oupss!');
      }
    });
  }

  displayFnCyclo(user: IUser): any {
    return user && user.fullname ? user.fullname : '';
  }

  optionSelectedCyclo(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.cycloUserUUID = selectedOption.uuid;
    this.cycloUserFullName = selectedOption.fullname;
  }

  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          fullname: this.formGroup.value.fullname,
          email: this.formGroup.value.email,
          title: this.formGroup.value.title,
          phone: this.formGroup.value.phone,
          password: this.formGroup.value.password,
          password_confirm: this.formGroup.value.password_confirm,

          country_uuid: this.formGroup.value.country_uuid,
          province_uuid: this.formGroup.value.province_uuid,
          area_uuid: this.formGroup.value.area_uuid,
          sub_area_uuid: this.formGroup.value.sub_area_uuid,
          commune_uuid: this.formGroup.value.commune_uuid,

          support_uuuid: (this.currentUser.role === 'Support') ? this.currentUser.uuid : '',
          support: (this.currentUser.role === 'Support') ? this.currentUser.fullname : '',
          manager_uuid: '',
          manager: '',
          asm_uuid: this.asmUserUUID || '',
          asm: this.asmFUserullName || '',
          sup_uuid: this.supUserUUID || '',
          sup: this.supUserFullName || '',
          dr_uuid: this.drUserUUID || '',
          dr: this.drUserFullName || '',
          cyclo_uuid: this.cycloUserUUID || '',
          cyclo: this.cycloUserFullName || '',

          role: this.formGroup.value.title,
          permission: this.formGroup.value.permission,
          status: (this.formGroup.value.status) ? this.formGroup.value.status : false,
          signature: this.currentUser.fullname,
        };
        this.usersService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'created',
              `Created new user uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.formGroup.reset();
                this.clearAutocompleteInputs();
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
            this.toastr.error(`${err.error.message}`, 'Oupss!');
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
        fullname: this.formGroup.value.fullname,
        email: this.formGroup.value.email,
        title: this.formGroup.value.title,
        phone: this.formGroup.value.phone,

        country_uuid: this.formGroup.value.country_uuid,
        province_uuid: this.formGroup.value.province_uuid,
        area_uuid: this.formGroup.value.area_uuid,
        sub_area_uuid: this.formGroup.value.sub_area_uuid,
        commune_uuid: this.formGroup.value.commune_uuid,

        support_uuuid: (this.currentUser.role === 'Support') ? this.currentUser.uuid : '',
        support: (this.currentUser.role === 'Support') ? this.currentUser.fullname : '',
        manager_uuid: '',
        manager: '',
        asm_uuid: this.asmUserUUID || '',
        asm: this.asmFUserullName || '',
        sup_uuid: this.supUserUUID || '',
        sup: this.supUserFullName || '',
        dr_uuid: this.drUserUUID || '',
        dr: this.drUserFullName || '',
        cyclo_uuid: this.cycloUserUUID || '',
        cyclo: this.cycloUserFullName || '',

        role: this.formGroup.value.title,
        permission: this.formGroup.value.permission,
        status: (this.formGroup.value.status) ? this.formGroup.value.status : false,
        signature: this.currentUser.fullname,
      };
      this.usersService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'updated',
              `Updated user uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.formGroup.reset();
                this.clearAutocompleteInputs();
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
    this.usersService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Users',
            this.currentUser.uuid,
            'deleted',
            `Delete user id: ${this.idItem}`,
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
      });
  }

  compareFn(c1: ICountry, c2: ICountry): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnProvince(c1: IProvince, c2: IProvince): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnArea(c1: IArea, c2: IArea): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnSubArea(c1: ISubArea, c2: ISubArea): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  compareFnCommune(c1: ICommune, c2: ICommune): boolean {
    return c1 && c2 ? c1.ID === c2.ID : c1 === c2;
  }

  onASMInputChange(): void {
    const selectedProvinceUuid = this.formGroup.get('province_uuid')?.value;
    if (selectedProvinceUuid) {
      this.getAllASMByProvince(selectedProvinceUuid);
    } else {
      this.getAllASM();
    }
  }

  onSupInputChange(): void {
    const selectedAreaUuid = this.formGroup.get('area_uuid')?.value;
    if (selectedAreaUuid) {
      this.getAllSupByArea(selectedAreaUuid);
    } else {
      this.getAllSup();
    }
  }

  onDrInputChange(): void {
    const selectedSubAreaUuid = this.formGroup.get('sub_area_uuid')?.value;
    if (selectedSubAreaUuid) {
      this.getAllDrBySubArea(selectedSubAreaUuid);
    } else {
      this.getAllDr();
    }
  }

  onCycloInputChange(): void {
    const selectedCommuneUuid = this.formGroup.get('commune_uuid')?.value;
    if (selectedCommuneUuid) {
      this.getAllCycloByCommune(selectedCommuneUuid);
    } else {
      this.getAllCyclo();
    }
  }
}
