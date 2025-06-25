import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { GeolocationService } from '@ng-web-apis/geolocation';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPosForm } from '../models/posform.model';
import { PosformService } from '../posform.service';
import { IUser } from '../../user/models/user.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { formatDate } from '@angular/common';
import { IRoutePlanItem } from '../../routeplan/models/routeplanItem.model';
// import { v4 as uuidv4 } from 'uuid';
import { BrandService } from '../../brand/brand.service';
import { IBrand } from '../../brand/models/brand.model';
import { IPosFormItem } from '../models/posform_item.model';
import { PosformItemService } from '../posformitem.service';
import { RouteplanService } from '../../routeplan/routeplan.service';
import { IRoutePlan } from '../../routeplan/models/routeplan.model';
import { RouteplanItemService } from '../../routeplan/routeplanitem.service';


@Component({
  selector: 'app-postform-list',
  standalone: false,
  templateUrl: './postform-list.component.html',
  styleUrl: './postform-list.component.scss'
})
export class PostformListComponent implements OnInit, AfterViewInit {
  isLoadingData = false;
  public routes = routes;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;
  rangeDate: any[] = [];

  dataList: IPosForm[] = [];
  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  // Table
  // Table
  displayedColumns: string[] = [
    'createdat',
    'pos',
    'country',
    'province',
    'area',
    'subarea',
    'commune',
    'price',
    'asm',
    'sup',
    'dr',
    'cyclo',
    'brand',
    'comment',
    'action'
  ];
  dataSource = new MatTableDataSource<IPosForm>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Propriétés pour les filtres avancés
  showAdvancedFilters = false;

  // Objet contenant tous les filtres
  filters = {
    country: '',
    province: '',
    area: '',
    subarea: '',
    commune: '',
    price: '',
    status: '',
    brandCount: '',
    posType: '',
    posSearch: '',
    quickDate: '',
    asm: '',
    asmSearch: '',
    supervisor: '',
    supervisorSearch: '',
    dr: '',
    drSearch: '',
    cyclo: '',
    cycloSearch: ''
  };

  // Listes des valeurs uniques pour les filtres
  uniqueCountries: string[] = [];
  uniqueProvinces: string[] = [];
  uniqueAreas: string[] = [];
  uniqueSubAreas: string[] = [];
  uniqueCommunes: string[] = [];
  uniquePrices: number[] = [];
  uniquePosTypes: string[] = [];
  uniqueAsms: string[] = [];
  uniqueSupervisors: string[] = [];
  uniqueDrs: string[] = [];
  uniqueCyclos: string[] = [];

  // Données originales et filtrées
  originalDataList: IPosForm[] = [];
  filteredDataList: IPosForm[] = [];

  // Flag pour indiquer si on est en train de compléter un rapport
  isCompletingReport = false;

  // Forms posform
  uuidItem: string = ''; // UUID of the item to be edited or deleted
  dataItem!: IPosForm; // Single data 

  // posformItem
  uuidPosformItem: string = ''; // UUID of the posformitem to be edited or deleted
  dataPosformItem!: IPosFormItem; // Single data

  // PosFormItem list
  dataListPosFormItem: IPosFormItem[] = [];


  // FormGroup for the main form posform
  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  // FormGroup for the posformitem
  formGroupPosFormItem!: FormGroup;
  isLoadingPosFormItem = false;

  // Geolocation
  latitude!: number;
  longitude!: number;

  priceList: string[] = ['50', '100', '150', '200', '250', '300'];

  // Get single Routeplan
  routePlan!: IRoutePlan;
  routePlanItemList: IRoutePlanItem[] = [];
  routePlanItemListFilter: IRoutePlanItem[] = [];
  filteredOptions: IRoutePlanItem[] = [];

  @ViewChild('pos_uuid') pos_uuid!: ElementRef<HTMLInputElement>;
  isload = false;
  posUUID: string = '';
  posName: string = '';

  // Liste brands
  brandList: IBrand[] = [];
  brandListFilter: IBrand[] = [];
  filteredOptionBrand: IBrand[] = [];
  isLoadingBrand = false;

  @ViewChild('brand_uuid') brand_uuid!: ElementRef<HTMLInputElement>;
  isloadBrand = false;
  brandUUID: string = '';
  brandName: string = '';


  constructor(
    private readonly geolocation$: GeolocationService,
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posformService: PosformService,
    private posformItemService: PosformItemService,
    private brandService: BrandService,
    private routePlanService: RouteplanService,
    private routePlanItemService: RouteplanItemService,
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


  ngAfterViewInit(): void {
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

        if (this.currentUser.province_uuid != '') {
          this.getAllRoutePlans();
          this.getAllBrand();
        }


        this.posformService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser, this.start_date, this.end_date);
        });
        this.fetchProducts(this.currentUser, this.start_date, this.end_date);

        this.onChanges();

        this.geolocation$.subscribe((position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          // console.log('Latitude:', position.coords.latitude);
          // console.log('Longitude:', position.coords.longitude);
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
      pos_uuid: ['', Validators.required],
      price: [0, Validators.required],
      comment: ['Rien à signaler', Validators.required],
    });

    this.formGroupPosFormItem = this._formBuilder.group({
      number_farde: ['', Validators.required],
      sold: [0, Validators.required],
    });
  }

  // Pour obtenir la liste des pos pour le plan de route
  getAllRoutePlans(): void {
    const filterValue = this.pos_uuid?.nativeElement.value.toLowerCase() || '';
    this.isload = true;

    this.routePlanService.getByUserUUID(this.currentUser.uuid).subscribe({
      next: (res) => {
        this.routePlan = res.data;
        console.log('Route Plan:', this.routePlan);
        if (this.routePlan.uuid != '') {
          this.routePlanItemService.getAllById(this.routePlan.uuid!).subscribe({
            next: (r) => {
              this.routePlanItemList = r.data;

              // Extraire les pos_uuid déjà utilisés dans les posforms existants
              // Mais exclure le pos_uuid actuel si on modifie un rapport existant
              const usedPosUuids = this.dataList
                .filter(posform => posform.uuid !== this.uuidItem) // Exclure le rapport actuel
                .map(posform => posform.pos_uuid)
                .filter(uuid => uuid !== null && uuid !== undefined);

              // Filtrer les items du route plan pour exclure ceux qui ont le status false ET qui ne sont pas déjà utilisés
              this.routePlanItemListFilter = this.routePlanItemList.filter(pos =>
                pos.uuid &&
                pos.status == false &&
                !usedPosUuids.includes(pos.pos_uuid)
              );

              this.filteredOptions = this.routePlanItemListFilter.filter(o => o.Pos!.name.toLowerCase().includes(filterValue));
              this.isload = false;
            },
            error: (error) => {
              this.isload = false;
              console.error('Error fetching route plan items:', error);
              this.toastr.info('Veuillez créer un plan de route.', 'Plan de route inexistant');
            }
          });
        }
      },
      error: (error) => {
        this.isload = false;
        console.error('Error fetching route plans:', error);
        this.toastr.error('Erreur lors de la récupération des plans de route.', 'Oupss!');
      }
    });
  }

  displayFn(item: IRoutePlanItem): any {
    if (!item) return '';
    if (!item.Pos) return '';
    return item.Pos.name || '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    this.posUUID = selectedOption.pos_uuid;
    this.posName = selectedOption.pos_name;


  }

  // Pour obtenir la liste des marques visitées
  getAllBrand(): void {
    const filterValue = this.brand_uuid?.nativeElement.value.toLowerCase();
    this.isloadBrand = true;

    this.brandService.getAllByASM(this.currentUser.province_uuid).subscribe({
      next: (res) => {
        this.brandList = res.data;

        // Extraire les brand_uuid déjà utilisés dans les posformItems existants
        const usedBrandUuids = this.dataListPosFormItem.map(item => item.brand_uuid).filter(uuid => uuid !== null && uuid !== undefined);

        // Filtrer les brands pour exclure ceux qui sont déjà utilisés
        this.brandListFilter = this.brandList.filter(brand =>
          brand.uuid &&
          !usedBrandUuids.includes(brand.uuid)
        );

        this.filteredOptionBrand = this.brandListFilter.filter(o => o.name!.toLowerCase().includes(filterValue));
        this.isloadBrand = false;
      },
      error: (error) => {
        this.isloadBrand = false;
        console.error('Error fetching brand items:', error);
        this.toastr.error('Erreur lors de la récupération des marques.', 'Oupss!');
      }
    });
  }

  displayFnBrand(brand: IBrand): any {
    if (!brand) return '';
    return brand.name || '';
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


      this.fetchProducts(this.currentUser, this.start_date, this.end_date);

    });
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;

    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
  }

  fetchProducts(currentUser: IUser, start_date: string, end_date: string): void {
    if (currentUser.role == 'Manager') {
      this.posformService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data]; // Sauvegarder les données originales
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.updateUniqueValues(); // Mettre à jour les valeurs uniques pour les filtres
          this.applyFilters(); // Appliquer les filtres
          this.getAllRoutePlans(); // Refresh route plans to exclude used POS

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'ASM') {
      this.posformService.getPaginatedRangeDateByProvinceId(
        currentUser.province_uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data]; // Sauvegarder les données originales
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.updateUniqueValues(); // Mettre à jour les valeurs uniques pour les filtres
          this.applyFilters(); // Appliquer les filtres
          this.getAllRoutePlans(); // Refresh route plans to exclude used POS

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'Supervisor') {
      this.posformService.getPaginatedRangeDateByAreaId(
        currentUser.area_uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data]; // Sauvegarder les données originales
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.updateUniqueValues(); // Mettre à jour les valeurs uniques pour les filtres
          this.applyFilters(); // Appliquer les filtres
          this.getAllRoutePlans(); // Refresh route plans to exclude used POS

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'DR') {
      this.posformService.getPaginatedRangeDateBySubAreaId(
        currentUser.dr_uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data]; // Sauvegarder les données originales
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.updateUniqueValues(); // Mettre à jour les valeurs uniques pour les filtres
          this.applyFilters(); // Appliquer les filtres
          this.getAllRoutePlans(); // Refresh route plans to exclude used POS

          this.isLoadingData = false;
        });
    } else if (currentUser.role == 'Cyclo') {
      this.posformService.getPaginatedRangeDateByCommuneId(
        currentUser.uuid, this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data, currentUser.uuid]; // Sauvegarder les données originales
          console.log('Data List:', this.dataList);
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.updateUniqueValues(); // Mettre à jour les valeurs uniques pour les filtres
          this.applyFilters(); // Appliquer les filtres
          this.getAllRoutePlans(); // Refresh route plans to exclude used POS

          this.isLoadingData = false;
        });
    } else {
      this.posformService.getPaginatedRangeDate2(this.current_page, this.page_size, this.search,
        start_date, end_date).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data]; // Sauvegarder les données originales
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.updateUniqueValues(); // Mettre à jour les valeurs uniques pour les filtres
          this.applyFilters(); // Appliquer les filtres
          this.getAllRoutePlans(); // Refresh route plans to exclude used POS

          this.isLoadingData = false;
        });
    }
  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
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

  // Méthodes pour les filtres avancés

  /**
   * Afficher/masquer les filtres avancés
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Mettre à jour les valeurs uniques pour tous les filtres
   */
  updateUniqueValues(): void {
    // Valeurs géographiques
    this.uniqueCountries = [...new Set(this.originalDataList
      .map(item => item.Country?.name)
      .filter(name => name))] as string[];

    this.uniqueProvinces = [...new Set(this.originalDataList
      .map(item => item.Province?.name)
      .filter(name => name))] as string[];

    this.uniqueAreas = [...new Set(this.originalDataList
      .map(item => item.Area?.name)
      .filter(name => name))] as string[];

    this.uniqueSubAreas = [...new Set(this.originalDataList
      .map(item => item.SubArea?.name)
      .filter(name => name))] as string[];

    this.uniqueCommunes = [...new Set(this.originalDataList
      .map(item => item.Commune?.name)
      .filter(name => name))] as string[];

    // Valeurs de prix
    this.uniquePrices = [...new Set(this.originalDataList
      .map(item => item.price)
      .filter(price => price !== null && price !== undefined))]
      .sort((a, b) => a - b);

    // Types de points de vente
    this.uniquePosTypes = [...new Set(this.originalDataList
      .map(item => item.Pos?.shop)
      .filter(shop => shop))] as string[];

    // Hiérarchie commerciale
    this.uniqueAsms = [...new Set(this.originalDataList
      .map(item => item.asm)
      .filter(asm => asm))] as string[];

    this.uniqueSupervisors = [...new Set(this.originalDataList
      .map(item => item.sup)
      .filter(sup => sup))] as string[];

    this.uniqueDrs = [...new Set(this.originalDataList
      .map(item => item.dr)
      .filter(dr => dr))] as string[];

    this.uniqueCyclos = [...new Set(this.originalDataList
      .map(item => item.cyclo)
      .filter(cyclo => cyclo))] as string[];

    // Debug: Afficher les valeurs uniques dans la console
    console.log('🔍 Filtres hiérarchie commerciale mis à jour:');
    console.log('  - ASMs:', this.uniqueAsms);
    console.log('  - Supervisors:', this.uniqueSupervisors);
    console.log('  - DRs:', this.uniqueDrs);
    console.log('  - Cyclos:', this.uniqueCyclos);
  }

  /**
   * Appliquer tous les filtres
   */
  applyFilters(): void {
    let filteredData = [...this.originalDataList];

    // Filtre par pays
    if (this.filters.country) {
      filteredData = filteredData.filter(item =>
        item.Country?.name === this.filters.country
      );
    }

    // Filtre par province
    if (this.filters.province) {
      filteredData = filteredData.filter(item =>
        item.Province?.name === this.filters.province
      );
    }

    // Filtre par area
    if (this.filters.area) {
      filteredData = filteredData.filter(item =>
        item.Area?.name === this.filters.area
      );
    }

    // Filtre par subarea
    if (this.filters.subarea) {
      filteredData = filteredData.filter(item =>
        item.SubArea?.name === this.filters.subarea
      );
    }

    // Filtre par commune
    if (this.filters.commune) {
      filteredData = filteredData.filter(item =>
        item.Commune?.name === this.filters.commune
      );
    }

    // Filtre par prix
    if (this.filters.price) {
      filteredData = filteredData.filter(item =>
        item.price === Number(this.filters.price)
      );
    }

    // Filtre par type de POS
    if (this.filters.posType) {
      filteredData = filteredData.filter(item =>
        item.Pos?.shop === this.filters.posType
      );
    }

    // Filtre par recherche de POS
    if (this.filters.posSearch) {
      const searchTerm = this.filters.posSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.Pos?.name?.toLowerCase().includes(searchTerm) ||
        item.Pos?.shop?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par statut
    if (this.filters.status) {
      if (this.filters.status === 'complete') {
        filteredData = filteredData.filter(item =>
          item.pos_uuid && item.pos_uuid.trim() !== ''
        );
      } else if (this.filters.status === 'incomplete') {
        filteredData = filteredData.filter(item =>
          !item.pos_uuid || item.pos_uuid.trim() === ''
        );
      }
    }

    // Filtre par nombre de marques
    if (this.filters.brandCount) {
      filteredData = filteredData.filter(item => {
        const brandCount = item.PosFormItems?.length || 0;
        switch (this.filters.brandCount) {
          case '0':
            return brandCount === 0;
          case '1':
            return brandCount === 1;
          case '2-5':
            return brandCount >= 2 && brandCount <= 5;
          case '6+':
            return brandCount >= 6;
          default:
            return true;
        }
      });
    }

    // Filtres hiérarchie commerciale
    if (this.filters.asm) {
      filteredData = filteredData.filter(item =>
        item.asm === this.filters.asm
      );
    }

    // Filtre de recherche ASM
    if (this.filters.asmSearch) {
      const searchTerm = this.filters.asmSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.asm?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.filters.supervisor) {
      filteredData = filteredData.filter(item =>
        item.sup === this.filters.supervisor
      );
    }

    // Filtre de recherche Supervisor
    if (this.filters.supervisorSearch) {
      const searchTerm = this.filters.supervisorSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.sup?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.filters.dr) {
      filteredData = filteredData.filter(item =>
        item.dr === this.filters.dr
      );
    }

    // Filtre de recherche DR
    if (this.filters.drSearch) {
      const searchTerm = this.filters.drSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.dr?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.filters.cyclo) {
      filteredData = filteredData.filter(item =>
        item.cyclo === this.filters.cyclo
      );
    }

    // Filtre de recherche Cyclo
    if (this.filters.cycloSearch) {
      const searchTerm = this.filters.cycloSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.cyclo?.toLowerCase().includes(searchTerm)
      );
    }

    // Mettre à jour les données filtrées
    this.filteredDataList = filteredData;
    this.dataSource.data = filteredData;
  }

  /**
   * Effacer tous les filtres
   */
  clearAllFilters(): void {
    this.filters = {
      country: '',
      province: '',
      area: '',
      subarea: '',
      commune: '',
      price: '',
      status: '',
      brandCount: '',
      posType: '',
      posSearch: '',
      quickDate: '',
      asm: '',
      asmSearch: '',
      supervisor: '',
      supervisorSearch: '',
      dr: '',
      drSearch: '',
      cyclo: '',
      cycloSearch: ''
    };
    this.applyFilters();
  }

  /**
   * Vérifier s'il y a des filtres actifs
   */
  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(value => value !== '');
  }

  /**
   * Compter le nombre de filtres actifs
   */
  getActiveFiltersCount(): number {
    return Object.values(this.filters).filter(value => value !== '').length;
  }

  /**
   * Obtenir le nombre d'éléments filtrés
   */
  getFilteredCount(): number {
    return this.filteredDataList.length;
  }

  /**
   * Méthode pour vérifier si une date est inférieure à 24 heures
   */
  isLessThan24HoursOld(date: Date): boolean {
    const now = new Date();
    const itemDate = new Date(date);
    const hoursDifference = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
    return hoursDifference < 24;
  }

  /**
   * Appliquer un filtre de date rapide
   */
  applyQuickDateFilter(value: string): void {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setDate(endDate.getDate() + 1); // Ajouter 1 jour pour inclure la date de fin

    switch (value) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        this.applyFilters();
        return;
    }

    // Mettre à jour le FormControl de dateRange
    this.dateRange.patchValue({
      rangeValue: [startDate, endDate]
    });

    // Déclencher le changement de date
    this.start_date = formatDate(startDate, 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(endDate, 'yyyy-MM-dd', 'en-US');
    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
  }

  /**
   * Exporter les données vers Excel
   */
  exportToExcel(): void {
    try {
      const dataToExport = this.filteredDataList.map(item => ({
        'Date de visite': formatDate(item.CreatedAt || new Date(), 'dd/MM/yyyy HH:mm', 'en-US'),
        'Point de vente': item.Pos?.name || 'Non renseigné',
        'Type de magasin': item.Pos?.shop || '--',
        'Pays': item.Country?.name || '--',
        'Province': item.Province?.name || '--',
        'Area': item.Area?.name || '--',
        'SubArea': item.SubArea?.name || '--',
        'Commune': item.Commune?.name || '--',
        'Coût (FC)': item.price,
        'ASM': item.asm || '--',
        'Supervisor': item.sup || '--',
        'DR': item.dr || '--',
        'Cyclo': item.cyclo || '--',
        'Nombre de marques': item.PosFormItems?.length || 0,
        'Commentaire': item.comment || '--',
        'Statut': (item.pos_uuid && item.pos_uuid.trim() !== '') ? 'Complet' : 'Incomplet'
      }));

      // Créer un élément temporaire pour télécharger
      const csvContent = this.convertToCSV(dataToExport);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rapports_visite_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm', 'en-US')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      this.toastr.success('Export Excel réussi!', 'Succès');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      this.toastr.error('Erreur lors de l\'export Excel', 'Erreur');
    }
  }

  /**
   * Exporter les données vers PDF
   */
  exportToPDF(): void {
    try {
      // Créer le contenu HTML pour l'impression
      let htmlContent = `
        <html>
        <head>
          <title>Rapports de visite</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>📋 Rapports de visite</h2>
            <p>Exporté le ${formatDate(new Date(), 'dd/MM/yyyy HH:mm', 'en-US')}</p>
            <p class="summary">Total: ${this.getFilteredCount()} rapport(s) sur ${this.total_records}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Point de vente</th>
                <th>Localisation</th>
                <th>Coût</th>
                <th>Marques</th>
                <th>Commentaire</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
      `;

      this.filteredDataList.forEach(item => {
        const location = [item.Province?.name, item.Area?.name, item.Commune?.name]
          .filter(l => l && l !== '--')
          .join(', ') || '--';

        htmlContent += `
          <tr>
            <td>${formatDate(item.CreatedAt || new Date(), 'dd/MM/yyyy', 'en-US')}</td>
            <td>${item.Pos?.name || 'Non renseigné'}</td>
            <td>${location}</td>
            <td>${item.price} FC</td>
            <td>${item.PosFormItems?.length || 0}</td>
            <td>${(item.comment || '--').substring(0, 50)}${item.comment && item.comment.length > 50 ? '...' : ''}</td>
            <td>${(item.pos_uuid && item.pos_uuid.trim() !== '') ? 'Complet' : 'Incomplet'}</td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      this.toastr.success('Export PDF initié!', 'Succès');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.toastr.error('Erreur lors de l\'export PDF', 'Erreur');
    }
  }

  /**
   * Convertir les données en format CSV
   */
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Échapper les virgules et guillemets dans les valeurs
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Méthodes manquantes pour le formulaire et les actions
   */

  findValue(uuid: string): void {
    console.log('🔍 findValue appelé avec uuid:', uuid);
    this.uuidItem = uuid;
    // Chercher d'abord dans les données filtrées, puis dans les données originales
    const foundItem = this.filteredDataList.find(item => item.uuid === uuid) ||
      this.originalDataList.find(item => item.uuid === uuid) ||
      this.dataList.find(item => item.uuid === uuid);

    if (foundItem) {
      this.dataItem = foundItem;
      console.log('✅ Élément trouvé:', this.dataItem);
      this.getAllPosFormItem(uuid);

      // Pré-remplir le formulaire d'édition
      this.formGroup.patchValue({
        pos_uuid: this.dataItem.pos_uuid || '',
        price: this.dataItem.price || '',
        comment: this.dataItem.comment || ''
      });

      // Si c'est un rapport incomplet (sans POS), adapter l'interface
      if (!this.dataItem.pos_uuid || this.dataItem.pos_uuid.trim() === '') {
        console.log('📝 Rapport incomplet détecté, préparation pour complétion...');
        this.isCompletingReport = true;
        // Réinitialiser les sélections de POS pour permettre une nouvelle sélection
        this.posUUID = '';
        this.posName = '';
        this.formGroup.patchValue({
          pos_uuid: ''
        });
      } else {
        console.log('✅ Rapport complet détecté pour modification...');
        this.isCompletingReport = false;
        // Si le rapport a déjà un POS, on garde les valeurs existantes
        this.posUUID = this.dataItem.pos_uuid;
      }

      // Forcer la détection des changements pour s'assurer que l'offcanvas se met à jour
      this.cdr.detectChanges();
    } else {
      console.error('❌ Impossible de trouver l\'élément avec uuid:', uuid);
      this.toastr.error('Élément non trouvé', 'Erreur');
    }
  }

  // Creation de rapport de visite
  onSubmit(): void {
    if (!this.canAddNewPosForm()) {
      this.toastr.warning('Vous devez d\'abord compléter le dernier PosForm en sélectionnant un POS.', 'Attention!');
      return;
    }

    if (this.formGroup.valid) {
      this.isLoading = true;

      const formData = {
        ...this.formGroup.value,
        pos_uuid: this.posUUID,
        latitude: this.latitude,
        longitude: this.longitude
      };

      this.posformService.update(this.uuidItem, formData).subscribe({
        next: (res) => {
          // Si un pos_uuid est fourni, mettre à jour le statut du routePlanItem à true
          if (this.posUUID && this.posUUID.trim() !== '') {
            this.routePlanItemService.updatePosStatus(this.posUUID, { status: true })
              .subscribe({
                next: () => {
                  console.log('Statut du RoutePlanItem mis à jour à true pour pos_uuid:', this.posUUID);
                  this.getAllRoutePlans(); // Rafraîchir la liste des route plans
                },
                error: (err) => {
                  console.error('Erreur lors de la mise à jour du statut RoutePlanItem:', err);
                  // Ne pas bloquer le processus principal en cas d'erreur
                }
              });
          }

          this.logActivity.activity(
            'PosForm',
            this.currentUser.uuid,
            'updated',
            `Updated PosForm uuid: ${this.uuidItem}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
              this.toastr.success('Rapport modifié avec succès!', 'Succès');
              this.fetchProducts(this.currentUser, this.start_date, this.end_date);
              this.isLoading = false;
            },
            error: (err) => {
              this.isLoading = false;
              this.toastr.error('Erreur lors de la sauvegarde du log', 'Erreur');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires', 'Attention');
    }
  }


  onSubmitUpdate(): void {
    if (!this.canAddNewPosForm()) {
      this.toastr.warning('Vous devez d\'abord compléter le dernier PosForm en sélectionnant un POS.', 'Attention!');
      return;
    }
    if (this.formGroup.valid) {
      this.isLoading = true;

      const formData = {
        ...this.formGroup.value,
        pos_uuid: this.posUUID,
        // latitude: this.latitude,
        // longitude: this.longitude
      };

      // Logique de soumission selon le contexte (création ou modification)
      if (this.uuidItem) {
        // Modification
        this.posformService.update(this.uuidItem, formData).subscribe({
          next: (res) => {
            // Si un pos_uuid est fourni, mettre à jour le statut du routePlanItem à true
            if (this.posUUID && this.posUUID.trim() !== '') {
              this.routePlanItemService.updatePosStatus(this.posUUID, { status: true })
                .subscribe({
                  next: () => {
                    console.log('Statut du RoutePlanItem mis à jour à true pour pos_uuid:', this.posUUID);
                    this.getAllRoutePlans(); // Rafraîchir la liste des route plans
                  },
                  error: (err) => {
                    console.error('Erreur lors de la mise à jour du statut RoutePlanItem:', err);
                    // Ne pas bloquer le processus principal en cas d'erreur
                  }
                });
            }

            this.logActivity.activity(
              'PosForm',
              this.currentUser.uuid,
              'updated',
              `Updated PosForm uuid: ${this.uuidItem}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.toastr.success('Rapport modifié avec succès!', 'Succès');
                this.fetchProducts(this.currentUser, this.start_date, this.end_date);
                this.isLoading = false;
              },
              error: (err) => {
                this.isLoading = false;
                this.toastr.error('Erreur lors de la sauvegarde du log', 'Erreur');
                console.error(err);
              }
            });
          },
          error: (err) => {
            this.isLoading = false;
            this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
            console.error(err);
          }
        });
      } else {
        // Création - cette logique est déjà gérée par onSubmitInit
        this.toastr.warning('Utilisez le bouton "Nouveau rapport" pour créer', 'Information');
        this.isLoading = false;
      }
    } else {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires', 'Attention');
    }
  }

  // PosFormItem Create
  onSubmitItem(): void {
    if (this.formGroupPosFormItem.valid && this.brandUUID) {
      this.isLoadingPosFormItem = true;

      const itemData = {
        ...this.formGroupPosFormItem.value,
        posform_uuid: this.uuidItem,
        brand_uuid: this.brandUUID,
        brand_name: this.brandName
      };

      this.posformItemService.create(itemData).subscribe({
        next: (res) => {
          this.toastr.success('Marque ajoutée avec succès!', 'Succès');
          this.getAllPosFormItem(this.uuidItem); // Rafraîchir la liste
          this.formGroupPosFormItem.reset();
          this.formGroupPosFormItem.patchValue({ sold: 0 });
          this.brandUUID = '';
          this.brandName = '';

          // Vider le champ de l'autocomplete brand
          if (this.brand_uuid && this.brand_uuid.nativeElement) {
            this.brand_uuid.nativeElement.value = '';
          }

          this.isLoadingPosFormItem = false;
        },
        error: (err) => {
          this.isLoadingPosFormItem = false;
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.toastr.warning('Veuillez remplir tous les champs et sélectionner une marque', 'Attention');
    }
  }

  // PosFormItem Delete
  deletePosFormItem(uuid: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) {
      this.posformItemService.delete(uuid).subscribe({
        next: () => {
          this.toastr.success('Marque supprimée avec succès!', 'Succès');
          this.getAllPosFormItem(this.uuidItem); // Rafraîchir la liste
        },
        error: (err) => {
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    }
  }

  // PosFormItem
  getAllPosFormItem(uuid: string) {
    this.isLoadingPosFormItem = true;
    this.posformItemService.getAllById(uuid).subscribe({
      next: (res) => {
        this.dataListPosFormItem = res.data;
        console.log('PosFormItem List:', this.dataListPosFormItem);
        this.getAllBrand(); // Refresh brand list to exclude used brands
        this.isLoadingPosFormItem = false;
      }, error: (err) => {
        this.isLoadingPosFormItem = false;
        this.toastr.error(`${err.error.message}`, 'Oupss!');
        console.log(err);
      }
    });
  }

  // Méthode pour vérifier si le bouton "Add New PosForm" doit être activé
  canAddNewPosForm(): boolean {
    if (!this.dataList || this.dataList.length === 0) {
      return true; // Si la liste est vide, permettre l'ajout
    }

    // Récupérer le dernier élément de la liste (plus récent)
    const lastItem = this.dataList[0]; // Assumant que la liste est triée par date décroissante

    // Vérifier si le dernier élément a un pos_uuid valide (non vide)
    return !!(lastItem.pos_uuid && typeof lastItem.pos_uuid === 'string' && lastItem.pos_uuid.trim() !== '');
  }

  async onSubmitInit() { 
    this.isLoading = true;
    var body: IPosForm = {
      // uuid: uuidv4(),
      price: 50,
      comment: 'Rien à signaler',
      latitude: this.latitude,
      longitude: this.longitude,
      pos_uuid: '', // This will be set later
      country_uuid: this.currentUser.country_uuid || '',
      province_uuid: this.currentUser.province_uuid || '',
      area_uuid: this.currentUser.area_uuid || '',
      sub_area_uuid: this.currentUser.sub_area_uuid || '',
      commune_uuid: this.currentUser.commune_uuid || '',
      asm_uuid: this.currentUser.asm_uuid || '',
      asm: this.currentUser.asm || '',
      sup_uuid: this.currentUser.sup_uuid || '',
      sup: this.currentUser.sup || '',
      dr_uuid: this.currentUser.dr_uuid || '',
      dr: this.currentUser.dr || '',
      cyclo_uuid: this.currentUser.cyclo_uuid || '',
      cyclo: this.currentUser.cyclo || '',
      user_uuid: this.currentUser.uuid,
      signature: this.currentUser.fullname, // Added signature property
      // sync: true,
    };
    console.log('Body:', body);
    this.posformService.create(body).subscribe({
      next: (res) => {
        this.logActivity.activity(
          'PosForm',
          this.currentUser.uuid,
          'created',
          `Created Posform uuid: ${res.data.uuid!}`, // 
          this.currentUser.fullname
        ).subscribe({
          next: () => {
            this.formGroup.reset();
            this.dataListPosFormItem = []; // Réinitialiser la liste des items
            this.fetchProducts(this.currentUser, this.start_date, this.end_date);
            this.toastr.success('Nouveau rapport créé avec succès!', 'Succès');
            this.uuidItem = res.data.uuid!; // Définir l'UUID pour les ajouts d'items
            this.isLoading = false;
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

  delete(): void {
    this.routePlanItemService.updatePosStatus(this.dataItem.pos_uuid!, { status: false })
      .subscribe({
        next: () => {
          this.posformService
            .delete(this.uuidItem)
            .subscribe({
              next: () => {
                this.logActivity.activity(
                  'Posform',
                  this.currentUser.uuid,
                  'deleted',
                  `Delete posform uuid: ${this.uuidItem}`,
                  this.currentUser.fullname
                ).subscribe({
                  next: () => {
                    this.formGroup.reset();
                    this.getAllRoutePlans(); // Refresh route plans to exclude used POS
                    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
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
                this.isLoading = false;
                this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
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

  /**
   * Compléter un rapport existant en ajoutant un POS
   */
  completeReport(): void {
    if (this.formGroup.valid && this.posUUID) {
      this.isLoading = true;

      const formData = {
        ...this.formGroup.value,
        pos_uuid: this.posUUID,
        latitude: this.latitude,
        longitude: this.longitude
      };

      // Mettre à jour le rapport avec le POS sélectionné
      this.posformService.update(this.uuidItem, formData).subscribe({
        next: (res) => {
          // Mettre à jour le statut du routePlanItem à true
          this.routePlanItemService.updatePosStatus(this.posUUID, { status: true })
            .subscribe({
              next: () => {
                console.log('✅ RoutePlanItem statut mis à jour à true pour pos_uuid:', this.posUUID);
                this.getAllRoutePlans(); // Rafraîchir la liste des route plans

                this.logActivity.activity(
                  'PosForm',
                  this.currentUser.uuid,
                  'completed',
                  `Completed PosForm uuid: ${this.uuidItem} with POS: ${this.posUUID}`,
                  this.currentUser.fullname
                ).subscribe({
                  next: () => {
                    this.toastr.success('🎉 Rapport complété avec succès! Le point de vente a été assigné.', 'Succès');
                    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
                    this.isLoading = false;

                    // Réinitialiser les variables
                    this.posUUID = '';
                    this.posName = '';
                    this.formGroup.reset();
                  },
                  error: (err) => {
                    this.isLoading = false;
                    this.toastr.error('Erreur lors de la sauvegarde du log', 'Erreur');
                    console.error(err);
                  }
                });
              },
              error: (err) => {
                console.error('❌ Erreur lors de la mise à jour du statut RoutePlanItem:', err);
                this.toastr.warning('Rapport mis à jour mais erreur de statut du plan de route', 'Attention');

                // Continuer même en cas d'erreur de mise à jour du statut
                this.logActivity.activity(
                  'PosForm',
                  this.currentUser.uuid,
                  'completed',
                  `Completed PosForm uuid: ${this.uuidItem} with POS: ${this.posUUID}`,
                  this.currentUser.fullname
                ).subscribe({
                  next: () => {
                    this.fetchProducts(this.currentUser, this.start_date, this.end_date);
                    this.isLoading = false;
                  },
                  error: (logErr) => {
                    this.isLoading = false;
                    console.error(logErr);
                  }
                });
              }
            });
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    } else {
      this.toastr.warning('Veuillez remplir tous les champs et sélectionner un point de vente', 'Attention');
    }
  }

  /**
   * TrackBy function pour optimiser les boucles ngFor
   */
  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByUuid(index: number, item: any): string {
    return item.uuid || index;
  }
}
