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
  step1FormGroup!: FormGroup;
  step2FormGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  // Stepper control
  currentStep = 1;
  step1UserData: any = null;

  // Edit stepper control
  currentEditStep = 1;
  editUserData: any = null;

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
    this.initializeForms();
  }

  initializeForms() {
    // Step 1 Form - Basic info + Territory
    this.step1FormGroup = this._formBuilder.group({
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
      area_uuid: [''],
      sub_area_uuid: [''],
      commune_uuid: [''],
    });

    // Step 2 Form - Hierarchical assignments
    this.step2FormGroup = this._formBuilder.group({
      asm_uuid: [''],
      sup_uuid: [''],
      dr_uuid: [''],
      cyclo_uuid: [''],
    });

    // Main form for edit functionality
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

      // Initialize edit form with steps
      this.initializeEditForm(this.dataItem);
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
    if (this.currentStep === 1) {
      // In step 1, we don't load ASM yet
    } else {
      this.getAllASMByProvince(event.value);
    }
    this.resetDependentDropdowns('province');
  }

  onAreaChange(event: any) {
    this.updateSubAreaList(event.value);
    if (this.currentStep === 1) {
      // In step 1, we don't load Supervisor yet  
    } else {
      this.getAllSupByArea(event.value);
    }
    this.resetDependentDropdowns('area');
  }

  onSubAreaChange(event: any) {
    this.updateCommuneList(event.value);
    if (this.currentStep === 1) {
      // In step 1, we don't load DR yet
    } else {
      this.getAllDrBySubArea(event.value);
    }
    this.resetDependentDropdowns('subarea');
  }

  onCommuneChange(event: any) {
    if (this.currentStep === 1) {
      // In step 1, we don't load Cyclo yet
    } else {
      this.getAllCycloByCommune(event.value);
    }
    this.resetDependentDropdowns('commune');
  }

  // Step 1 specific territory change handlers
  onStep1CountryChange(event: any) {
    this.updateProvinceList(event.value);
    this.resetStep1DependentDropdowns('country');
  }

  onStep1ProvinceChange(event: any) {
    this.updateAreaList(event.value);
    this.resetStep1DependentDropdowns('province');
  }

  onStep1AreaChange(event: any) {
    this.updateSubAreaList(event.value);
    this.resetStep1DependentDropdowns('area');
  }

  onStep1SubAreaChange(event: any) {
    this.updateCommuneList(event.value);
    this.resetStep1DependentDropdowns('subarea');
  }

  onStep1CommuneChange(event: any) {
    // No dependent dropdowns for commune in step 1
  }

  private resetStep1DependentDropdowns(level: string) {
    switch (level) {
      case 'country':
        this.areaListFilter = [];
        this.subAreaListFilter = [];
        this.communeListFilter = [];
        this.step1FormGroup.patchValue({
          province_uuid: '',
          area_uuid: '',
          sub_area_uuid: '',
          commune_uuid: ''
        });
        break;
      case 'province':
        this.subAreaListFilter = [];
        this.communeListFilter = [];
        this.step1FormGroup.patchValue({
          area_uuid: '',
          sub_area_uuid: '',
          commune_uuid: ''
        });
        break;
      case 'area':
        this.communeListFilter = [];
        this.step1FormGroup.patchValue({
          sub_area_uuid: '',
          commune_uuid: ''
        });
        break;
      case 'subarea':
        this.step1FormGroup.patchValue({
          commune_uuid: ''
        });
        break;
    }
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

  getAllASMByProvince(provinceUuid: string): void {
    if (!provinceUuid) return;
    
    const filterValue = this.user_asm_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadASM = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userASMList = res.data;
        this.userASMListFilter = this.userASMList.filter((u) => 
          (u.title === 'ASM' || u.title === 'Manager') && u.province_uuid === provinceUuid
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

  getAllSupByArea(areaUuid: string): void {
    if (!areaUuid) return;

    const filterValue = this.user_sup_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadSup = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userSupList = res.data;
        this.userSupListFilter = this.userSupList.filter((u) => 
          u.title === 'Supervisor' && u.area_uuid === areaUuid
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

  getAllDrBySubArea(subAreaUuid: string): void {
    if (!subAreaUuid) return;

    const filterValue = this.user_dr_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadDr = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userDrList = res.data;
        this.userDrListFilter = this.userDrList.filter((u) => {
          const isDR = u.title === 'DR';
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

  getAllCycloByCommune(communeUuid: string): void {
    if (!communeUuid) return;

    const filterValue = this.user_cyclo_uuid?.nativeElement.value.toLowerCase() || '';
    this.isloadCyclo = true;

    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userCycloList = res.data;
        this.userCycloListFilter = this.userCycloList.filter((u) => 
          u.title === 'Cyclo' && u.commune_uuid === communeUuid
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

  // Step 1 - Basic info and Territory submission
  onSubmitStep1() {
    try {
      if (this.step1FormGroup.valid) {
        this.isLoading = true;
        var body = {
          fullname: this.step1FormGroup.value.fullname,
          email: this.step1FormGroup.value.email,
          title: this.step1FormGroup.value.title,
          phone: this.step1FormGroup.value.phone,
          password: this.step1FormGroup.value.password,
          password_confirm: this.step1FormGroup.value.password_confirm,

          country_uuid: this.step1FormGroup.value.country_uuid,
          province_uuid: this.step1FormGroup.value.province_uuid,
          area_uuid: this.step1FormGroup.value.area_uuid,
          sub_area_uuid: this.step1FormGroup.value.sub_area_uuid,
          commune_uuid: this.step1FormGroup.value.commune_uuid,

          support_uuuid: (this.currentUser.role === 'Support') ? this.currentUser.uuid : '',
          support: (this.currentUser.role === 'Support') ? this.currentUser.fullname : '',
          manager_uuid: '',
          manager: '',
          asm_uuid: '',
          asm: '',
          sup_uuid: '',
          sup: '',
          dr_uuid: '',
          dr: '',
          cyclo_uuid: '',
          cyclo: '',

          role: this.step1FormGroup.value.title,
          permission: this.step1FormGroup.value.permission,
          status: (this.step1FormGroup.value.status) ? this.step1FormGroup.value.status : false,
          signature: this.currentUser.fullname,
        };

        this.usersService.create(body).subscribe({
          next: (res) => {
            this.step1UserData = res.data;
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'created',
              `Created new user uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.currentStep = 2;
                this.initializeStep2FilteredData();
                this.toastr.success('Étape 1 terminée avec succès! Passons à l\'assignation des rôles.', 'Success!');
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

  // Step 2 - Hierarchical assignments update
  onSubmitStep2() {
    try {
      if (this.step1UserData) {
        this.isLoading = true;
        var body = {
          fullname: this.step1UserData.fullname,
          email: this.step1UserData.email,
          title: this.step1UserData.title,
          phone: this.step1UserData.phone,

          country_uuid: this.step1UserData.country_uuid,
          province_uuid: this.step1UserData.province_uuid,
          area_uuid: this.step1UserData.area_uuid,
          sub_area_uuid: this.step1UserData.sub_area_uuid,
          commune_uuid: this.step1UserData.commune_uuid,

          support_uuuid: this.step1UserData.support_uuuid,
          support: this.step1UserData.support,
          manager_uuid: this.step1UserData.manager_uuid,
          manager: this.step1UserData.manager,
          asm_uuid: this.asmUserUUID || '',
          asm: this.asmFUserullName || '',
          sup_uuid: this.supUserUUID || '',
          sup: this.supUserFullName || '',
          dr_uuid: this.drUserUUID || '',
          dr: this.drUserFullName || '',
          cyclo_uuid: this.cycloUserUUID || '',
          cyclo: this.cycloUserFullName || '',

          role: this.step1UserData.role,
          permission: this.step1UserData.permission,
          status: this.step1UserData.status,
          signature: this.currentUser.fullname,
        };

        this.usersService.update(this.step1UserData.uuid, body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'updated',
              `Updated user hierarchical assignments uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.resetFormSteps();
                this.toastr.success('Utilisateur créé avec succès!', 'Success!');
                // Close the modal programmatically
                this.closeAddModal();
                // Refresh data list
                this.fetchProducts();
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

  // Initialize filtered data for step 2 based on step 1 territory selections
  initializeStep2FilteredData() {
    if (this.step1UserData) {
      console.log('Step1UserData:', this.step1UserData);
      
      // SUPER SIMPLE: Just load ASM for the province
      this.loadASMForProvince(this.step1UserData.province_uuid);
      this.loadSupForArea(this.step1UserData.area_uuid);
      this.loadDrForSubArea(this.step1UserData.sub_area_uuid);
      this.loadCycloForCommune(this.step1UserData.commune_uuid);
    } else {
      console.log('No step1UserData available');
    }
  }

  // SUPER SIMPLE METHOD: Load ASM for province
  loadASMForProvince(provinceUuid: string): void {
    if (!provinceUuid) {
      console.log('No province UUID provided');
      return;
    }
    
    this.isloadASM = true;
    console.log('Loading ASM for province:', provinceUuid);
    
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        // Get all users
        const allUsers = res.data;
        console.log('Total users loaded:', allUsers.length);
        console.log('Available roles:', [...new Set(allUsers.map(u => u.role))]);
        
        // Filter ASM by province - SIMPLE!
        this.filteredOptionASMs = allUsers.filter(user => 
          user.role === 'ASM' && user.province_uuid === provinceUuid
        );
        
        console.log('ASM found:', this.filteredOptionASMs.length);
        console.log('ASM list:', this.filteredOptionASMs.map(u => u.fullname));
        
        this.isloadASM = false;
      },
      error: (error) => {
        this.isloadASM = false;
        console.error('Error loading ASM:', error);
      }
    });
  }

  // Simple methods for other roles
  loadSupForArea(areaUuid: string): void {
    if (!areaUuid) return;
    this.isloadSup = true;
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.filteredOptionSups = res.data.filter(user => 
          user.role === 'Supervisor' && user.area_uuid === areaUuid
        );
        console.log('Supervisors found:', this.filteredOptionSups.length);
        this.isloadSup = false;
      },
      error: () => this.isloadSup = false
    });
  }

  loadDrForSubArea(subAreaUuid: string): void {
    if (!subAreaUuid) return;
    this.isloadDr = true;
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.filteredOptionDrs = res.data.filter(user => 
          user.role === 'DR' && user.sub_area_uuid === subAreaUuid
        );
        console.log('DR found:', this.filteredOptionDrs.length);
        this.isloadDr = false;
      },
      error: () => this.isloadDr = false
    });
  }

  loadCycloForCommune(communeUuid: string): void {
    if (!communeUuid) return;
    this.isloadCyclo = true;
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.filteredOptionCyclos = res.data.filter(user => 
          user.role === 'Cyclo' && user.commune_uuid === communeUuid
        );
        console.log('Cyclos found:', this.filteredOptionCyclos.length);
        this.isloadCyclo = false;
      },
      error: () => this.isloadCyclo = false
    });
  }

  // Pre-load and filter ASM users
  loadAndFilterASMByProvince(provinceUuid: string): void {
    this.isloadASM = true;
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userASMList = res.data;
        console.log('All users loaded:', this.userASMList.length);
        console.log('Available titles:', [...new Set(this.userASMList.map(u => u.title))]);
        console.log('Users with province_uuid:', this.userASMList.filter(u => u.province_uuid === provinceUuid).length);
        
        // Pre-filter by province and title - try both 'ASM' and 'Manager' titles
        this.filteredOptionASMs = this.userASMList.filter((u) => 
          (u.title === 'ASM' || u.title === 'Manager') && u.province_uuid === provinceUuid
        );
        
        console.log('Filtered ASM options:', this.filteredOptionASMs.length);
        console.log('ASM data:', this.filteredOptionASMs);
        this.isloadASM = false;
      },
      error: (error) => {
        this.isloadASM = false;
        console.error('Error fetching ASM users:', error);
        this.toastr.error('Erreur lors de la récupération des ASM.', 'Oupss!');
      }
    });
  }

  // Pre-load and filter Supervisor users
  loadAndFilterSupByArea(areaUuid: string): void {
    this.isloadSup = true;
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userSupList = res.data;
        // Pre-filter by area and title
        this.filteredOptionSups = this.userSupList.filter((u) => 
          u.title === 'Supervisor' && u.area_uuid === areaUuid
        );
        this.isloadSup = false;
      },
      error: (error) => {
        this.isloadSup = false;
        console.error('Error fetching Supervisor users:', error);
        this.toastr.error('Erreur lors de la récupération des Superviseurs.', 'Oupss!');
      }
    });
  }

  // Pre-load and filter DR users
  loadAndFilterDrBySubArea(subAreaUuid: string): void {
    this.isloadDr = true;
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userDrList = res.data;
        // Pre-filter by sub_area and title
        this.filteredOptionDrs = this.userDrList.filter((u) => 
          u.title === 'DR' && u.sub_area_uuid === subAreaUuid
        );
        this.isloadDr = false;
      },
      error: (error) => {
        this.isloadDr = false;
        console.error('Error fetching DR users:', error);
        this.toastr.error('Erreur lors de la récupération des DR.', 'Oupss!');
      }
    });
  }

  // Pre-load and filter Cyclo users
  loadAndFilterCycloByCommune(communeUuid: string): void {
    this.isloadCyclo = true;
    this.usersService.getPaginated2(1, 100, '').subscribe({
      next: (res) => {
        this.userCycloList = res.data;
        // Pre-filter by commune and title
        this.filteredOptionCyclos = this.userCycloList.filter((u) => 
          u.title === 'Cyclo' && u.commune_uuid === communeUuid
        );
        this.isloadCyclo = false;
      },
      error: (error) => {
        this.isloadCyclo = false;
        console.error('Error fetching Cyclo users:', error);
        this.toastr.error('Erreur lors de la récupération des Cyclos.', 'Oupss!');
      }
    });
  }

  // Navigation methods
  goToStep1() {
    this.currentStep = 1;
  }

  goToStep2() {
    if (this.step1FormGroup.valid) {
      this.currentStep = 2;
    } else {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires de l\'étape 1', 'Attention!');
    }
  }

  resetFormSteps() {
    this.currentStep = 1;
    this.step1UserData = null;
    this.step1FormGroup.reset();
    this.step2FormGroup.reset();
    this.clearAutocompleteInputs();
    // Reset filtered lists
    this.provinceListFilter = [];
    this.areaListFilter = [];
    this.subAreaListFilter = [];
    this.communeListFilter = [];
    this.filteredOptionASMs = [];
    this.filteredOptionSups = [];
    this.filteredOptionDrs = [];
    this.filteredOptionCyclos = [];
  }

  // Method to initialize form when opening add modal
  initializeAddForm() {
    this.resetFormSteps();
    this.provinceListFilter = [];
    this.areaListFilter = [];
    this.subAreaListFilter = [];
    this.communeListFilter = [];
    this.filteredOptionASMs = [];
    this.filteredOptionSups = [];
    this.filteredOptionDrs = [];
    this.filteredOptionCyclos = [];
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
    // For step 2, filter from already pre-loaded data
    if (this.currentStep === 2 && this.step1UserData) {
      const filterValue = this.user_asm_uuid?.nativeElement.value.toLowerCase() || '';
      this.filteredOptionASMs = this.userASMList.filter((u) => 
        (u.role === 'ASM') && 
        u.province_uuid === this.step1UserData.province_uuid &&
        u.fullname!.toLowerCase().includes(filterValue)
      );
    } else {
      // For edit mode, use the original logic
      const selectedProvinceUuid = this.formGroup.get('province_uuid')?.value || 
                                    this.step1FormGroup?.get('province_uuid')?.value;
      if (selectedProvinceUuid) {
        this.getAllASMByProvince(selectedProvinceUuid);
      }
    }
  }

  onSupInputChange(): void {
    // For step 2, filter from already pre-loaded data
    if (this.currentStep === 2 && this.step1UserData) {
      const filterValue = this.user_sup_uuid?.nativeElement.value.toLowerCase() || '';
      this.filteredOptionSups = this.userSupList.filter((u) => 
        u.role === 'Supervisor' && 
        u.area_uuid === this.step1UserData.area_uuid &&
        u.fullname!.toLowerCase().includes(filterValue)
      );
    } else {
      // For edit mode, use the original logic
      const selectedAreaUuid = this.formGroup.get('area_uuid')?.value ||
                               this.step1FormGroup?.get('area_uuid')?.value;
      if (selectedAreaUuid) {
        this.getAllSupByArea(selectedAreaUuid);
      }
    }
  }

  onDrInputChange(): void {
    // For step 2, filter from already pre-loaded data
    if (this.currentStep === 2 && this.step1UserData) {
      const filterValue = this.user_dr_uuid?.nativeElement.value.toLowerCase() || '';
      this.filteredOptionDrs = this.userDrList.filter((u) => 
        u.role === 'DR' && 
        u.sub_area_uuid === this.step1UserData.sub_area_uuid &&
        u.fullname!.toLowerCase().includes(filterValue)
      );
    } else {
      // For edit mode, use the original logic
      const selectedSubAreaUuid = this.formGroup.get('sub_area_uuid')?.value ||
                                  this.step1FormGroup?.get('sub_area_uuid')?.value;
      if (selectedSubAreaUuid) {
        this.getAllDrBySubArea(selectedSubAreaUuid);
      }
    }
  }

  onCycloInputChange(): void {
    // For step 2, filter from already pre-loaded data
    if (this.currentStep === 2 && this.step1UserData) {
      const filterValue = this.user_cyclo_uuid?.nativeElement.value.toLowerCase() || '';
      this.filteredOptionCyclos = this.userCycloList.filter((u) => 
        u.role === 'Cyclo' && 
        u.commune_uuid === this.step1UserData.commune_uuid &&
        u.fullname!.toLowerCase().includes(filterValue)
      );
    } else {
      // For edit mode, use the original logic
      const selectedCommuneUuid = this.formGroup.get('commune_uuid')?.value ||
                                  this.step1FormGroup?.get('commune_uuid')?.value;
      if (selectedCommuneUuid) {
        this.getAllCycloByCommune(selectedCommuneUuid);
      }
    }
  }

  // Focus handlers for step 2 autocompletes - SUPER SIMPLE
  onASMFocus(): void {
    if (this.currentStep === 2 && this.step1UserData) {
      // Re-load ASM if not already loaded
      if (this.filteredOptionASMs.length === 0) {
        this.loadASMForProvince(this.step1UserData.province_uuid);
      }
    }
  }

  onSupFocus(): void {
    if (this.currentStep === 2 && this.step1UserData) {
      if (this.filteredOptionSups.length === 0) {
        this.loadSupForArea(this.step1UserData.area_uuid);
      }
    }
  }

  onDrFocus(): void {
    if (this.currentStep === 2 && this.step1UserData) {
      if (this.filteredOptionDrs.length === 0) {
        this.loadDrForSubArea(this.step1UserData.sub_area_uuid);
      }
    }
  }

  onCycloFocus(): void {
    if (this.currentStep === 2 && this.step1UserData) {
      if (this.filteredOptionCyclos.length === 0) {
        this.loadCycloForCommune(this.step1UserData.commune_uuid);
      }
    }
  }

  // Edit form methods - Step based editing
  initializeEditForm(userData: IUser) {
    this.currentEditStep = 1;
    this.editUserData = userData;
    this.updateCascadingDropdowns();
    this.restoreAutocompleteValues();
  }

  // Step 1 - Update basic info and territory
  onSubmitEditStep1() {
    try {
      if (this.formGroup.valid) {
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

          support_uuuid: this.editUserData.support_uuuid,
          support: this.editUserData.support,
          manager_uuid: this.editUserData.manager_uuid,
          manager: this.editUserData.manager,
          asm_uuid: this.editUserData.asm_uuid,
          asm: this.editUserData.asm,
          sup_uuid: this.editUserData.sup_uuid,
          sup: this.editUserData.sup,
          dr_uuid: this.editUserData.dr_uuid,
          dr: this.editUserData.dr,
          cyclo_uuid: this.editUserData.cyclo_uuid,
          cyclo: this.editUserData.cyclo,

          role: this.formGroup.value.title,
          permission: this.formGroup.value.permission,
          status: this.formGroup.value.status,
          signature: this.currentUser.fullname,
        };

        this.usersService.update(this.idItem, body).subscribe({
          next: (res) => {
            this.editUserData = res.data;
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'updated',
              `Updated user basic info uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.currentEditStep = 2;
                this.initializeEditStep2FilteredData();
                this.toastr.success('Étape 1 modifiée avec succès! Passons aux rôles.', 'Success!');
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

  // Step 2 - Update hierarchical assignments
  onSubmitEditStep2() {
    try {
      if (this.editUserData) {
        this.isLoading = true;
        var body = {
          fullname: this.editUserData.fullname,
          email: this.editUserData.email,
          title: this.editUserData.title,
          phone: this.editUserData.phone,

          country_uuid: this.editUserData.country_uuid,
          province_uuid: this.editUserData.province_uuid,
          area_uuid: this.editUserData.area_uuid,
          sub_area_uuid: this.editUserData.sub_area_uuid,
          commune_uuid: this.editUserData.commune_uuid,

          support_uuuid: this.editUserData.support_uuuid,
          support: this.editUserData.support,
          manager_uuid: this.editUserData.manager_uuid,
          manager: this.editUserData.manager,
          asm_uuid: this.asmUserUUID || '',
          asm: this.asmFUserullName || '',
          sup_uuid: this.supUserUUID || '',
          sup: this.supUserFullName || '',
          dr_uuid: this.drUserUUID || '',
          dr: this.drUserFullName || '',
          cyclo_uuid: this.cycloUserUUID || '',
          cyclo: this.cycloUserFullName || '',

          role: this.editUserData.role,
          permission: this.editUserData.permission,
          status: this.editUserData.status,
          signature: this.currentUser.fullname,
        };

        this.usersService.update(this.editUserData.uuid, body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'Users',
              this.currentUser.uuid,
              'updated',
              `Updated user hierarchical assignments uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.resetEditFormSteps();
                this.toastr.success('Utilisateur modifié avec succès!', 'Success!');
                this.closeEditModal();
                this.fetchProducts();
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

  // Initialize filtered data for edit step 2
  initializeEditStep2FilteredData() {
    if (this.editUserData) {
      console.log('Edit Step2 - Loading data for:', this.editUserData);
      
      this.loadASMForProvince(this.editUserData.province_uuid);
      this.loadSupForArea(this.editUserData.area_uuid);
      this.loadDrForSubArea(this.editUserData.sub_area_uuid);
      this.loadCycloForCommune(this.editUserData.commune_uuid);
    }
  }

  // Navigation methods for edit
  goToEditStep1() {
    this.currentEditStep = 1;
  }

  goToEditStep2() {
    if (this.formGroup.valid) {
      this.currentEditStep = 2;
    } else {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires de l\'étape 1', 'Attention!');
    }
  }

  resetEditFormSteps() {
    this.currentEditStep = 1;
    this.editUserData = null;
    this.clearAutocompleteInputs();
  }

  // Utility method to close the add modal
  closeAddModal() {
    const offcanvasElement = document.getElementById('offcanvas_add');
    if (offcanvasElement) {
      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvasElement);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
  }

  // Utility method to close the edit modal
  closeEditModal() {
    const offcanvasElement = document.getElementById('offcanvas_edit');
    if (offcanvasElement) {
      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvasElement);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
  }
}
