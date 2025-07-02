import { ChangeDetectorRef, Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { ToastrService } from 'ngx-toastr';
import { IPos } from '../models/pos.model';
import { PosVenteService } from '../pos-vente.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator'; 
import { routes } from '../../../../shared/routes/routes';
import { IUser } from '../../../management/user/models/user.model';
import { AuthService } from '../../../../auth/auth.service';
import { CountryService } from '../../../territories/country/country.service';
import { ProvinceService } from '../../../territories/province/province.service';
import { AreaService } from '../../../territories/areas/area.service';
import { SubareaService } from '../../../territories/subarea/subarea.service';
import { LogsService } from '../../../management/user-logs/logs.service';
import { IPosForm } from '../../posform/models/posform.model';

@Component({
  selector: 'app-pos-filter-list',
  standalone: false,
  templateUrl: './pos-filter-list.component.html',
  styleUrl: './pos-filter-list.component.scss'
})
export class PosFilterListComponent implements OnInit {
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
    'fullname',
    'posforms',
    'action'
  ];
  dataSource = new MatTableDataSource<IPos>(this.dataList);

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
    postype: '',
    status: '',
    shop: '',
    name: '',
    gerant: '',
    telephone: '',
    quartier: '',
    avenue: '',
    reference: '',
    signature: '',
    asm: '',
    asmSearch: '',
    supervisor: '',
    supervisorSearch: '',
    dr: '',
    drSearch: '',
    cyclo: '',
    cycloSearch: '',
    sync: '',
    posformsCount: ''
  };

  // Listes des valeurs uniques pour les filtres
  uniqueCountries: string[] = [];
  uniqueProvinces: string[] = [];
  uniqueAreas: string[] = [];
  uniqueSubAreas: string[] = [];
  uniqueCommunes: string[] = [];
  uniquePosTypes: string[] = [];
  uniqueShops: string[] = [];
  uniqueSignatures: string[] = [];
  uniqueAsms: string[] = [];
  uniqueSupervisors: string[] = [];
  uniqueDrs: string[] = [];
  uniqueCyclos: string[] = [];

  // Listes filtrées pour la hiérarchie commerciale
  filteredAsms: string[] = [];
  filteredSupervisors: string[] = [];
  filteredDrs: string[] = [];
  filteredCyclos: string[] = [];

  // Données originales et filtrées
  originalDataList: IPos[] = [];
  filteredDataList: IPos[] = [];

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


  name!: string;
  territoire_uuid!: string;
  territoire!: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posVenteService: PosVenteService,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private areaService: AreaService,
    private subAreaService: SubareaService,
    private logActivity: LogsService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private toastr: ToastrService
  ) {
  }


  ngOnInit() { 
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

    this.isLoadingData = true;
    this.route.params.subscribe(params => {
      this.name = params['name'];
      this.territoire_uuid = params['uuid'];

      this.authService.user().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
          this.dataSource.sort = this.sort; // Bind sort to dataSource
          this.cdr.detectChanges(); // Trigger change detection

          this.posVenteService.refreshDataList$.subscribe(() => {
            this.fetchProducts(this.name, this.territoire_uuid);
          });
          this.fetchProducts(this.name, this.territoire_uuid);
        },
        error: (error) => {
          this.isLoadingData = false;
          this.router.navigate(['/auth/login']);
          console.log(error);
        }
      });

    });
  }

  getPosFormCount(posForm: IPosForm[]): string {
    return posForm ? posForm.length > 0 ? posForm.length.toString() : '0' : '0';
  }


  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;

    this.fetchProducts(this.name, this.territoire_uuid);
  }




  fetchProducts(name: string, territoire_uuid: string) {
    // Préparer les filtres pour l'envoi au backend
    const filterParams = {
      search: this.search,
      ...this.filters
    };

    // Utiliser la nouvelle méthode avec filtres avancés
    this.posVenteService.getPaginatedWithAdvancedFilters(
      this.current_page,
      this.page_size,
      filterParams
    ).subscribe({
      next: (res) => {
        this.dataList = res.data;
        this.originalDataList = [...res.data]; // Conserver une copie des données originales
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList;
        this.updateUniqueValues(); // Mettre à jour les valeurs uniques pour les filtres
        this.isLoadingData = false;
      },
      error: (err) => {
        console.log('Erreur lors de la récupération des données:', err);
        // Fallback vers les anciennes méthodes en cas d'erreur
        this.fetchProductsOldMethod(name, territoire_uuid);
      }
    });
  }

  // Méthode de fallback avec l'ancienne logique
  fetchProductsOldMethod(name: string, territoire_uuid: string) {
    if (name == 'country') {
      this.countryService.get(this.territoire_uuid).subscribe(res => {
        this.territoire = res.data;
        this.posVenteService.getPaginatedByCountryUUId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data];
          console.log("dataList", this.dataList);
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList;
          this.updateUniqueValues();
          this.isLoadingData = false;
        });
      });

    } else if (name == 'province') {
      this.provinceService.get(this.territoire_uuid).subscribe(res => {
        this.territoire = res.data;
        console.log("territoire", this.territoire);
        this.isLoadingData = true;
        // Récupérer les données paginées par province
        this.posVenteService.getPaginatedByAreaId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data];
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList;
          this.updateUniqueValues();
          this.isLoadingData = false;
        });
      });
    } else if (name == 'area') {
      this.areaService.get(this.territoire_uuid).subscribe(res => {
        this.territoire = res.data;
        console.log("territoire", this.territoire);
        this.isLoadingData = true;
        // Récupérer les données paginées par area
        this.posVenteService.getPaginatedBySubAreaId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data];
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList;
          this.updateUniqueValues();
          this.isLoadingData = false;
        });
      });
    } else if (name == 'subarea') {
      this.subAreaService.get(this.territoire_uuid).subscribe(res => {
        this.territoire = res.data;
        console.log("territoire", this.territoire);
        this.isLoadingData = true;
        // Récupérer les données paginées par subarea
        this.posVenteService.getPaginatedByCommuneId(territoire_uuid, this.current_page, this.page_size, this.search).subscribe(res => {
          this.dataList = res.data;
          this.originalDataList = [...res.data];
          this.total_pages = res.pagination.total_pages;
          this.total_records = res.pagination.total_records;
          this.dataSource.data = this.dataList;
          this.updateUniqueValues();
          this.isLoadingData = false;
        });
      });
    }
  }


  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts(this.name, this.territoire_uuid);
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

    // Valeurs spécifiques aux POS
    this.uniquePosTypes = [...new Set(this.originalDataList
      .map(item => item.postype)
      .filter(type => type))] as string[];

    this.uniqueShops = [...new Set(this.originalDataList
      .map(item => item.shop)
      .filter(shop => shop))] as string[];

    // Valeurs de signature/fullname
    this.uniqueSignatures = [...new Set(this.originalDataList
      .map(item => item.signature)
      .filter(signature => signature))] as string[];

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

    // Initialiser les listes filtrées pour la hiérarchie commerciale
    this.filteredAsms = [...this.uniqueAsms];
    this.filteredSupervisors = [...this.uniqueSupervisors];
    this.filteredDrs = [...this.uniqueDrs];
    this.filteredCyclos = [...this.uniqueCyclos];

    console.log('🔍 Filtres hiérarchie commerciale mis à jour pour POS:');
    console.log('  - ASMs:', this.uniqueAsms);
    console.log('  - Supervisors:', this.uniqueSupervisors);
    console.log('  - DRs:', this.uniqueDrs);
    console.log('  - Cyclos:', this.uniqueCyclos);
  }

  /**
   * Appliquer tous les filtres
   */
  applyFilters(): void {
    this.current_page = 1; // Reset à la première page lors de l'application de filtres
    this.fetchProducts(this.name, this.territoire_uuid);
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
      postype: '',
      status: '',
      shop: '',
      name: '',
      gerant: '',
      telephone: '',
      quartier: '',
      avenue: '',
      reference: '',
      signature: '',
      asm: '',
      asmSearch: '',
      supervisor: '',
      supervisorSearch: '',
      dr: '',
      drSearch: '',
      cyclo: '',
      cycloSearch: '',
      sync: '',
      posformsCount: ''
    };

    this.search = '';
    this.applyFilters();
  }

  /**
   * Filtrer les ASMs en fonction de la recherche
   */
  filterAsms(): void {
    if (this.filters.asmSearch) {
      const searchTerm = this.filters.asmSearch.toLowerCase();
      this.filteredAsms = this.uniqueAsms.filter(asm =>
        asm.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredAsms = [...this.uniqueAsms];
    }
    this.applyFilters();
  }

  /**
   * Filtrer les Supervisors en fonction de la recherche
   */
  filterSupervisors(): void {
    if (this.filters.supervisorSearch) {
      const searchTerm = this.filters.supervisorSearch.toLowerCase();
      this.filteredSupervisors = this.uniqueSupervisors.filter(sup =>
        sup.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredSupervisors = [...this.uniqueSupervisors];
    }
    this.applyFilters();
  }

  /**
   * Filtrer les DRs en fonction de la recherche
   */
  filterDrs(): void {
    if (this.filters.drSearch) {
      const searchTerm = this.filters.drSearch.toLowerCase();
      this.filteredDrs = this.uniqueDrs.filter(dr =>
        dr.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredDrs = [...this.uniqueDrs];
    }
    this.applyFilters();
  }

  /**
   * Filtrer les Cyclos en fonction de la recherche
   */
  filterCyclos(): void {
    if (this.filters.cycloSearch) {
      const searchTerm = this.filters.cycloSearch.toLowerCase();
      this.filteredCyclos = this.uniqueCyclos.filter(cyclo =>
        cyclo.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredCyclos = [...this.uniqueCyclos];
    }
    this.applyFilters();
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
