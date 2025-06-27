import { ChangeDetectorRef, Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr'; 
import { formatDate } from '@angular/common'; 
import { routes } from '../../../../shared/routes/routes';
import { IPosForm } from '../../../posform/models/posform.model';
import { IUser } from '../../../user/models/user.model';
import { AuthService } from '../../../../auth/auth.service';
import { PosformService } from '../../../posform/posform.service';
import { LogsService } from '../../../user-logs/logs.service';
import { IPosFormItem } from '../../../posform/models/posform_item.model';
import { PosformItemService } from '../../../posform/posformitem.service';
import { IBrand } from '../../../brand/models/brand.model';
import { BrandService } from '../../../brand/brand.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-posforms',
  standalone: false,
  templateUrl: './posforms.component.html',
  styleUrls: ['./posforms.component.scss']
})
export class PosformsComponent implements OnInit, AfterViewInit {
  @Input() posUUId!: string;
  
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

  // Listes filtrées pour la hiérarchie commerciale
  filteredAsms: string[] = [];
  filteredSupervisors: string[] = [];
  filteredDrs: string[] = [];
  filteredCyclos: string[] = [];

  // Données originales et filtrées
  originalDataList: IPosForm[] = [];
  filteredDataList: IPosForm[] = [];

  // Table 
  displayedColumns: string[] = ['createdat', 'price', 'asm', 'sup', 'dr', 'cyclo', 'brand', 'comment', 'action'];
  dataSource = new MatTableDataSource<IPosForm>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  // Forms  
  idItem!: string;
  dataItem!: IPosForm; // Single data 

  // posformItem
  uuidPosformItem: string = ''; // UUID of the posformitem to be edited or deleted
  dataPosformItem!: IPosFormItem; // Single data

  // PosFormItem list
  dataListPosFormItem: IPosFormItem[] = [];

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  // FormGroup for the posformitem
  formGroupPosFormItem!: FormGroup;
  isLoadingPosFormItem = false;

  // Liste brands
  brandList: IBrand[] = [];
  brandListFilter: IBrand[] = [];
  filteredOptionBrand: IBrand[] = [];
  isLoadingBrand = false;

  @ViewChild('brand_uuid') brand_uuid!: ElementRef<HTMLInputElement>;
  isloadBrand = false;
  brandUUID: string = '';
  brandName: string = '';

  priceList: string[] = ['50', '100', '150', '200', '250', '300'];

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posformService: PosformService,
    private posformItemService: PosformItemService,
    private brandService: BrandService,
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

            // Initialiser les marques si l'utilisateur a une province
            if (this.currentUser.province_uuid) {
              this.getAllBrand();
            }

            this.posformService.refreshDataList$.subscribe(() => {
              this.fetchProducts(this.posUUId);
            });
            this.fetchProducts(this.posUUId);
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

    // Initialize forms
    this.formGroup = this._formBuilder.group({
      price: [50, Validators.required],
      comment: ['Rien à signaler', Validators.required],
    });

    this.formGroupPosFormItem = this._formBuilder.group({
      number_farde: ['', Validators.required],
      sold: [0, Validators.required],
    });
  }


  // Méthode onChanges
  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      this.fetchProducts(this.posUUId);

    });
  }



  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.current_page = event.pageIndex + 1; // Adjust for 1-based page index
    this.page_size = event.pageSize;
    this.fetchProducts(this.posUUId);
  }

  fetchProducts(uuid: string) {
    this.posformService.getPaginatedRangeDateByUUID(
      uuid, this.current_page, this.page_size, this.search,
      this.start_date, this.end_date).subscribe(res => {
        this.dataList = res.data;
        this.originalDataList = [...res.data]; // Sauvegarder les données originales
        this.total_pages = res.pagination.total_pages;
        this.total_records = res.pagination.total_records;
        this.dataSource.data = this.dataList; // Update dataSource data
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        
        // Mettre à jour les valeurs uniques pour les filtres
        this.updateUniqueValues();
        this.applyFilters();
        
        this.isLoadingData = false;
      });
  }





  onSearchChange(search: string) {
    this.search = search;
    this.current_page = 1; // Reset à la première page lors de la recherche
    this.fetchProducts(this.posUUId);
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
      
      // Initialiser le formulaire avec les données
      this.formGroup.patchValue({
        price: this.dataItem.price || 50,
        comment: this.dataItem.comment || 'Rien à signaler'
      });
      
      // Charger les éléments PosForm et les marques
      this.getAllPosFormItem(this.idItem);
      
      if (this.currentUser.province_uuid) {
        this.getAllBrand();
      }
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

  /**
   * Mettre à jour les valeurs uniques pour les filtres
   */
  updateUniqueValues(): void {
    this.uniqueCountries = [...new Set(this.originalDataList.map(item => item.Country?.name).filter(name => name))] as string[];
    this.uniqueProvinces = [...new Set(this.originalDataList.map(item => item.Province?.name).filter(name => name))] as string[];
    this.uniqueAreas = [...new Set(this.originalDataList.map(item => item.Area?.name).filter(name => name))] as string[];
    this.uniqueSubAreas = [...new Set(this.originalDataList.map(item => item.SubArea?.name).filter(name => name))] as string[];
    this.uniqueCommunes = [...new Set(this.originalDataList.map(item => item.Commune?.name).filter(name => name))] as string[];
    this.uniquePrices = [...new Set(this.originalDataList.map(item => item.price).filter(price => price !== null && price !== undefined))];
    this.uniquePosTypes = [...new Set(this.originalDataList.map(item => item.Pos?.shop).filter(shop => shop))] as string[];
    this.uniqueAsms = [...new Set(this.originalDataList.map(item => item.asm).filter(asm => asm))] as string[];
    this.uniqueSupervisors = [...new Set(this.originalDataList.map(item => item.sup).filter(sup => sup))] as string[];
    this.uniqueDrs = [...new Set(this.originalDataList.map(item => item.dr).filter(dr => dr))] as string[];
    this.uniqueCyclos = [...new Set(this.originalDataList.map(item => item.cyclo).filter(cyclo => cyclo))] as string[];

    // Initialiser les listes filtrées
    this.filteredAsms = [...this.uniqueAsms];
    this.filteredSupervisors = [...this.uniqueSupervisors];
    this.filteredDrs = [...this.uniqueDrs];
    this.filteredCyclos = [...this.uniqueCyclos];
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    let filteredData = [...this.originalDataList];

    // Filtre par recherche générale
    if (this.search) {
      const searchTerm = this.search.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.Pos?.name?.toLowerCase().includes(searchTerm) ||
        item.comment?.toLowerCase().includes(searchTerm) ||
        item.asm?.toLowerCase().includes(searchTerm) ||
        item.sup?.toLowerCase().includes(searchTerm) ||
        item.dr?.toLowerCase().includes(searchTerm) ||
        item.cyclo?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtres géographiques
    if (this.filters.country) {
      filteredData = filteredData.filter(item =>
        item.Country?.name === this.filters.country
      );
    }

    if (this.filters.province) {
      filteredData = filteredData.filter(item =>
        item.Province?.name === this.filters.province
      );
    }

    if (this.filters.area) {
      filteredData = filteredData.filter(item =>
        item.Area?.name === this.filters.area
      );
    }

    if (this.filters.subarea) {
      filteredData = filteredData.filter(item =>
        item.SubArea?.name === this.filters.subarea
      );
    }

    if (this.filters.commune) {
      filteredData = filteredData.filter(item =>
        item.Commune?.name === this.filters.commune
      );
    }

    // Filtre par prix
    if (this.filters.price) {
      filteredData = filteredData.filter(item =>
        item.price?.toString() === this.filters.price
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
          case '5':
            return brandCount === 5;
          case '5-10':
            return brandCount >= 5 && brandCount <= 10;
          case '11+':
            return brandCount >= 11;
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

    if (this.filters.cycloSearch) {
      const searchTerm = this.filters.cycloSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.cyclo?.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredDataList = filteredData;
    this.dataSource.data = this.filteredDataList;
  }

  /**
   * Afficher/masquer les filtres avancés
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Réinitialiser tous les filtres
   */
  resetFilters(): void {
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
    this.search = '';
    this.applyFilters();
  }

  /**
   * Vérifier si des filtres sont actifs
   */
  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(value => value !== '') || this.search !== '';
  }

  /**
   * Compter les filtres actifs
   */
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.search) count++;
    Object.values(this.filters).forEach(value => {
      if (value !== '') count++;
    });
    return count;
  }

  /**
   * Filtrer les options ASM
   */
  filterAsmOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredAsms = [...this.uniqueAsms];
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredAsms = this.uniqueAsms.filter(asm =>
        asm.toLowerCase().includes(search)
      );
    }
  }

  /**
   * Obtenir les ASMs filtrés
   */
  getFilteredAsms(): string[] {
    return this.filteredAsms;
  }

  /**
   * Filtrer les options Supervisor
   */
  filterSupervisorOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredSupervisors = [...this.uniqueSupervisors];
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredSupervisors = this.uniqueSupervisors.filter(supervisor =>
        supervisor.toLowerCase().includes(search)
      );
    }
  }

  /**
   * Obtenir les Supervisors filtrés
   */
  getFilteredSupervisors(): string[] {
    return this.filteredSupervisors;
  }

  /**
   * Filtrer les options DR
   */
  filterDrOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredDrs = [...this.uniqueDrs];
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredDrs = this.uniqueDrs.filter(dr =>
        dr.toLowerCase().includes(search)
      );
    }
  }

  /**
   * Obtenir les DRs filtrés
   */
  getFilteredDrs(): string[] {
    return this.filteredDrs;
  }

  /**
   * Filtrer les options Cyclo
   */
  filterCycloOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredCyclos = [...this.uniqueCyclos];
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredCyclos = this.uniqueCyclos.filter(cyclo =>
        cyclo.toLowerCase().includes(search)
      );
    }
  }

  /**
   * Obtenir les Cyclos filtrés
   */
  getFilteredCyclos(): string[] {
    return this.filteredCyclos;
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
        console.error('Error fetching brands:', error);
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

  // PosFormItem Create
  onSubmitItem(): void {
    if (this.formGroupPosFormItem.valid && this.brandUUID) {
      this.isLoadingPosFormItem = true;

      const itemData = {
        ...this.formGroupPosFormItem.value,
        posform_uuid: this.idItem,
        brand_uuid: this.brandUUID,
        brand_name: this.brandName
      };

      this.posformItemService.create(itemData).subscribe({
        next: (res) => {
          this.toastr.success('Marque ajoutée avec succès!', 'Succès');
          this.getAllPosFormItem(this.idItem); // Rafraîchir la liste
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
          this.getAllPosFormItem(this.idItem); // Rafraîchir la liste
        },
        error: (err) => {
          this.toastr.error(`Erreur: ${err.error.message}`, 'Erreur');
          console.error(err);
        }
      });
    }
  }

  // Mise à jour d'un PosForm
  onSubmitUpdate(): void {
    if (this.formGroup.valid) {
      this.isLoading = true;

      const formData = {
        price: parseInt(this.formGroup.value.price) || 50,
        comment: this.formGroup.value.comment || '',
      };

      this.posformService.update(this.idItem, formData).subscribe({
        next: (res) => {
          this.logActivity.activity(
            'PosForm',
            this.currentUser.uuid,
            'updated',
            `Updated PosForm uuid: ${this.idItem}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
              this.toastr.success('Rapport modifié avec succès!', 'Succès');
              this.fetchProducts(this.posUUId);
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

  /**
   * Obtenir le nombre d'éléments filtrés
   */
  getFilteredCount(): number {
    return this.filteredDataList.length;
  }
}
