import { ChangeDetectorRef, Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormGroup, FormBuilder, Validators, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ToastrService } from 'ngx-toastr'; 
import { IBrand } from '../../../brand/models/brand.model';
import { BrandService } from '../../../brand/brand.service';
import { IPosForm } from '../../../posform/models/posform.model';
import { AuthService } from '../../../../../auth/auth.service';
import { PosformService } from '../../../posform/posform.service';
import { LogsService } from '../../../../management/user-logs/logs.service';
import { PosformItemService } from '../../../posform/posformitem.service';
import { IPosFormItem } from '../../../posform/models/posform_item.model';
import { IUser } from '../../../../management/user/models/user.model';
import { routes } from '../../../../../shared/routes/routes';

@Component({
  selector: 'app-posforms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    MatIconModule,
    BsDatepickerModule
  ],
  templateUrl: './posforms.component.html',
  styleUrls: ['./posforms.component.scss']
})
export class PosformsComponent implements OnInit, AfterViewInit {
  @Input() posUUId!: string;
  
  // Services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private posformService = inject(PosformService);
  private posformItemService = inject(PosformItemService);
  private brandService = inject(BrandService);
  private logActivity = inject(LogsService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);
  
  isLoadingData = signal(false);
  public routes = routes;

  // Table 
  dataList = signal<IPosForm[]>([]);
  total_pages = signal(0);
  page_size = signal(15);
  current_page = signal(1);
  total_records = signal(0);

  dateRange = signal<FormGroup>(null!);
  start_date = signal<string>('');
  end_date = signal<string>('');
  rangeDate = signal<any[]>([]);

  // Propriétés pour les filtres avancés
  showAdvancedFilters = signal(false);

  // Objet contenant tous les filtres
  filters = signal({
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
  });

  // Listes des valeurs uniques pour les filtres
  uniqueCountries = signal<string[]>([]);
  uniqueProvinces = signal<string[]>([]);
  uniqueAreas = signal<string[]>([]);
  uniqueSubAreas = signal<string[]>([]);
  uniqueCommunes = signal<string[]>([]);
  uniquePrices = signal<number[]>([]);
  uniquePosTypes = signal<string[]>([]);
  uniqueAsms = signal<string[]>([]);
  uniqueSupervisors = signal<string[]>([]);
  uniqueDrs = signal<string[]>([]);
  uniqueCyclos = signal<string[]>([]);

  // Listes filtrées pour la hiérarchie commerciale
  filteredAsms = signal<string[]>([]);
  filteredSupervisors = signal<string[]>([]);
  filteredDrs = signal<string[]>([]);
  filteredCyclos = signal<string[]>([]);

  // Données originales et filtrées
  originalDataList = signal<IPosForm[]>([]);
  filteredDataList = signal<IPosForm[]>([]);

  // Table 
  displayedColumns = signal<string[]>(['createdat', 'price', 'asm', 'sup', 'dr', 'cyclo', 'brand', 'comment', 'action']);
  dataSource = new MatTableDataSource<IPosForm>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = signal('');

  // Forms  
  idItem = signal<string>('');
  dataItem = signal<IPosForm>(null!); // Single data 

  // posformItem
  uuidPosformItem = signal(''); // UUID of the posformitem to be edited or deleted
  dataPosformItem = signal<IPosFormItem>(null!); // Single data

  // PosFormItem list
  dataListPosFormItem = signal<IPosFormItem[]>([]);

  formGroup = signal<FormGroup>(null!);
  currentUser = signal<IUser>(null!);
  isLoading = signal(false);

  // FormGroup for the posformitem
  formGroupPosFormItem = signal<FormGroup>(null!);
  isLoadingPosFormItem = signal(false);

  // Liste brands
  brandList = signal<IBrand[]>([]);
  brandListFilter = signal<IBrand[]>([]);
  filteredOptionBrand = signal<IBrand[]>([]);
  isLoadingBrand = signal(false);

  @ViewChild('brand_uuid') brand_uuid!: ElementRef<HTMLInputElement>;
  isloadBrand = signal(false);
  brandUUID = signal('');
  brandName = signal('');

  priceList = signal<string[]>(['50', '100', '150', '200', '250', '300']);




  ngAfterViewInit(): void {
     this.authService.user().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (user) => {
            this.currentUser.set(user);
            this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
            this.dataSource.sort = this.sort; // Bind sort to dataSource
            this.cdr.detectChanges(); // Trigger change detection

            // Initialiser les marques si l'utilisateur a une province
            if (this.currentUser().province_uuid) {
              this.getAllBrand();
            }

            this.posformService.refreshDataList$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
              this.fetchProducts(this.posUUId);
            });
            this.fetchProducts(this.posUUId);
          },
          error: (error) => {
            this.isLoadingData.set(false);
            this.router.navigate(['/auth/login']);
            console.log(error);
          }
        });
  }


  ngOnInit() {
    this.isLoadingData.set(true);

    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1); // First day of the current month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1); // First day of the next month
    lastDay.setDate(lastDay.getDate() + 1); // Add 1 day to the last day
    this.rangeDate.set([firstDay, lastDay]);

    this.dateRange.set(this._formBuilder.group({
      rangeValue: new FormControl(this.rangeDate()),
    }));
    this.start_date.set(formatDate(this.dateRange().value.rangeValue[0], 'yyyy-MM-dd', 'en-US'));
    this.end_date.set(formatDate(this.dateRange().value.rangeValue[1], 'yyyy-MM-dd', 'en-US'));

    // Initialize forms
    this.formGroup.set(this._formBuilder.group({
      price: [50, Validators.required],
      comment: ['Rien à signaler', Validators.required],
    }));

    this.formGroupPosFormItem.set(this._formBuilder.group({
      number_farde: ['', Validators.required],
      sold: [0, Validators.required],
    }));
  }


  // Méthode onChanges
  onChanges(): void {
    this.dateRange().valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      this.start_date.set(formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US'));

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date.set(formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US'));

      this.fetchProducts(this.posUUId);

    });
  }



  onPageChange(event: PageEvent): void {
    this.isLoadingData.set(true);
    this.current_page.set(event.pageIndex + 1); // Adjust for 1-based page index
    this.page_size.set(event.pageSize);
    this.fetchProducts(this.posUUId);
  }

  fetchProducts(uuid: string) {
    this.posformService.getPaginatedRangeDateByUUID(
      uuid, this.current_page(), this.page_size(), this.search(),
      this.start_date(), this.end_date()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
        this.dataList.set(res.data);
        this.originalDataList.set([...res.data]); // Sauvegarder les données originales
        this.total_pages.set(res.pagination.total_pages);
        this.total_records.set(res.pagination.total_records);
        this.dataSource.data = this.dataList(); // Update dataSource data
        this.dataSource.paginator = this.paginator; // Bind paginator to dataSource
        this.dataSource.sort = this.sort; // Bind sort to dataSource
        
        // Mettre à jour les valeurs uniques pour les filtres
        this.updateUniqueValues();
        this.applyFilters();
        
        this.isLoadingData.set(false);
      });
  }





  onSearchChange(search: string) {
    this.search.set(search);
    this.current_page.set(1); // Reset à la première page lors de la recherche
    this.fetchProducts(this.posUUId);
  }


  public sortData(sort: Sort) {
    const data = this.dataList().slice();
    if (!sort.active || sort.direction === '') {
      this.dataList.set(data);
    } else {
      this.dataList.set(data.sort((a, b) => {
        const aValue = (a as never)[sort.active];
        const bValue = (b as never)[sort.active];
        return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
      }));
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  findValue(value: string) {
    this.idItem.set(value);
    this.posformService.get(this.idItem()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(item => {
      this.dataItem.set(item.data);
      
      // Initialiser le formulaire avec les données
      this.formGroup().patchValue({
        price: this.dataItem().price || 50,
        comment: this.dataItem().comment || 'Rien à signaler'
      });
      
      // Charger les éléments PosForm et les marques
      this.getAllPosFormItem(this.idItem());
      
      if (this.currentUser().province_uuid) {
        this.getAllBrand();
      }
    });
  }



  delete(): void {
    this.posformService
      .delete(this.idItem())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'PosForm',
            this.currentUser().uuid,
            'deleted',
            `Delete PosForm id: ${this.idItem()}`,
            this.currentUser().fullname
          ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              this.formGroup().reset();
              this.toastr.info('Supprimé avec succès!', 'Success!');
              this.isLoading.set(false);
            },
            error: (err) => {
              this.isLoading.set(false);
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
    this.uniqueCountries.set([...new Set(this.originalDataList().map(item => item.Country?.name).filter(name => name))] as string[]);
    this.uniqueProvinces.set([...new Set(this.originalDataList().map(item => item.Province?.name).filter(name => name))] as string[]);
    this.uniqueAreas.set([...new Set(this.originalDataList().map(item => item.Area?.name).filter(name => name))] as string[]);
    this.uniqueSubAreas.set([...new Set(this.originalDataList().map(item => item.SubArea?.name).filter(name => name))] as string[]);
    this.uniqueCommunes.set([...new Set(this.originalDataList().map(item => item.Commune?.name).filter(name => name))] as string[]);
    this.uniquePrices.set([...new Set(this.originalDataList().map(item => item.price).filter(price => price !== null && price !== undefined))]);
    this.uniquePosTypes.set([...new Set(this.originalDataList().map(item => item.Pos?.shop).filter(shop => shop))] as string[]);
    this.uniqueAsms.set([...new Set(this.originalDataList().map(item => item.asm).filter(asm => asm))] as string[]);
    this.uniqueSupervisors.set([...new Set(this.originalDataList().map(item => item.sup).filter(sup => sup))] as string[]);
    this.uniqueDrs.set([...new Set(this.originalDataList().map(item => item.dr).filter(dr => dr))] as string[]);
    this.uniqueCyclos.set([...new Set(this.originalDataList().map(item => item.cyclo).filter(cyclo => cyclo))] as string[]);

    // Initialiser les listes filtrées
    this.filteredAsms.set([...this.uniqueAsms()]);
    this.filteredSupervisors.set([...this.uniqueSupervisors()]);
    this.filteredDrs.set([...this.uniqueDrs()]);
    this.filteredCyclos.set([...this.uniqueCyclos()]);
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    let filteredData = [...this.originalDataList()];

    // Filtre par recherche générale
    if (this.search()) {
      const searchTerm = this.search().toLowerCase();
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
    if (this.filters().country) {
      filteredData = filteredData.filter(item =>
        item.Country?.name === this.filters().country
      );
    }

    if (this.filters().province) {
      filteredData = filteredData.filter(item =>
        item.Province?.name === this.filters().province
      );
    }

    if (this.filters().area) {
      filteredData = filteredData.filter(item =>
        item.Area?.name === this.filters().area
      );
    }

    if (this.filters().subarea) {
      filteredData = filteredData.filter(item =>
        item.SubArea?.name === this.filters().subarea
      );
    }

    if (this.filters().commune) {
      filteredData = filteredData.filter(item =>
        item.Commune?.name === this.filters().commune
      );
    }

    // Filtre par prix
    if (this.filters().price) {
      filteredData = filteredData.filter(item =>
        item.price?.toString() === this.filters().price
      );
    }

    // Filtre par type de POS
    if (this.filters().posType) {
      filteredData = filteredData.filter(item =>
        item.Pos?.shop === this.filters().posType
      );
    }

    // Filtre par recherche de POS
    if (this.filters().posSearch) {
      const searchTerm = this.filters().posSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.Pos?.name?.toLowerCase().includes(searchTerm) ||
        item.Pos?.shop?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par statut
    if (this.filters().status) {
      if (this.filters().status === 'complete') {
        filteredData = filteredData.filter(item =>
          item.pos_uuid && item.pos_uuid.trim() !== ''
        );
      } else if (this.filters().status === 'incomplete') {
        filteredData = filteredData.filter(item =>
          !item.pos_uuid || item.pos_uuid.trim() === ''
        );
      }
    }

    // Filtre par nombre de marques
    if (this.filters().brandCount) {
      filteredData = filteredData.filter(item => {
        const brandCount = item.PosFormItems?.length || 0;
        switch (this.filters().brandCount) {
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
    if (this.filters().asm) {
      filteredData = filteredData.filter(item =>
        item.asm === this.filters().asm
      );
    }

    if (this.filters().asmSearch) {
      const searchTerm = this.filters().asmSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.asm?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.filters().supervisor) {
      filteredData = filteredData.filter(item =>
        item.sup === this.filters().supervisor
      );
    }

    if (this.filters().supervisorSearch) {
      const searchTerm = this.filters().supervisorSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.sup?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.filters().dr) {
      filteredData = filteredData.filter(item =>
        item.dr === this.filters().dr
      );
    }

    if (this.filters().drSearch) {
      const searchTerm = this.filters().drSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.dr?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.filters().cyclo) {
      filteredData = filteredData.filter(item =>
        item.cyclo === this.filters().cyclo
      );
    }

    if (this.filters().cycloSearch) {
      const searchTerm = this.filters().cycloSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.cyclo?.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredDataList.set(filteredData);
    this.dataSource.data = this.filteredDataList();
  }

  /**
   * Afficher/masquer les filtres avancés
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  /**
   * Réinitialiser tous les filtres
   */
  resetFilters(): void {
    this.filters.set({
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
    });
    this.search.set('');
    this.applyFilters();
  }

  /**
   * Vérifier si des filtres sont actifs
   */
  hasActiveFilters(): boolean {
    return Object.values(this.filters()).some(value => value !== '') || this.search() !== '';
  }

  /**
   * Compter les filtres actifs
   */
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.search()) count++;
    Object.values(this.filters()).forEach(value => {
      if (value !== '') count++;
    });
    return count;
  }

  /**
   * Filtrer les options ASM
   */
  filterAsmOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredAsms.set([...this.uniqueAsms()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredAsms.set(this.uniqueAsms().filter(asm =>
        asm.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les ASMs filtrés
   */
  getFilteredAsms(): string[] {
    return this.filteredAsms();
  }

  /**
   * Filtrer les options Supervisor
   */
  filterSupervisorOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredSupervisors.set([...this.uniqueSupervisors()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredSupervisors.set(this.uniqueSupervisors().filter(supervisor =>
        supervisor.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les Supervisors filtrés
   */
  getFilteredSupervisors(): string[] {
    return this.filteredSupervisors();
  }

  /**
   * Filtrer les options DR
   */
  filterDrOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredDrs.set([...this.uniqueDrs()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredDrs.set(this.uniqueDrs().filter(dr =>
        dr.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les DRs filtrés
   */
  getFilteredDrs(): string[] {
    return this.filteredDrs();
  }

  /**
   * Filtrer les options Cyclo
   */
  filterCycloOptions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredCyclos.set([...this.uniqueCyclos()]);
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredCyclos.set(this.uniqueCyclos().filter(cyclo =>
        cyclo.toLowerCase().includes(search)
      ));
    }
  }

  /**
   * Obtenir les Cyclos filtrés
   */
  getFilteredCyclos(): string[] {
    return this.filteredCyclos();
  }

  // Pour obtenir la liste des marques visitées
  getAllBrand(): void {
    const filterValue = this.brand_uuid?.nativeElement.value.toLowerCase();
    this.isloadBrand.set(true);

    this.brandService.getAllByASM(this.currentUser().province_uuid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.brandList.set(res.data);

        // Extraire les brand_uuid déjà utilisés dans les posformItems existants
        const usedBrandUuids = this.dataListPosFormItem().map(item => item.brand_uuid).filter(uuid => uuid !== null && uuid !== undefined);

        // Filtrer les brands pour exclure ceux qui sont déjà utilisés
        this.brandListFilter.set(this.brandList().filter(brand =>
          brand.uuid &&
          !usedBrandUuids.includes(brand.uuid)
        ));

        this.filteredOptionBrand.set(this.brandListFilter().filter(o => o.name!.toLowerCase().includes(filterValue)));
        this.isloadBrand.set(false);
      },
      error: (error) => {
        this.isloadBrand.set(false);
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
    this.brandUUID.set(selectedOption.uuid);
    this.brandName.set(selectedOption.name);

    // Utilisez id et fullName comme vous le souhaitez
    console.log('brand_uuid:', this.brandUUID());
  }

  // PosFormItem
  getAllPosFormItem(uuid: string) {
    this.isLoadingPosFormItem.set(true);
    this.posformItemService.getAllById(uuid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.dataListPosFormItem.set(res.data);
        console.log('PosFormItem List:', this.dataListPosFormItem());
        this.getAllBrand(); // Refresh brand list to exclude used brands
        this.isLoadingPosFormItem.set(false);
      }, error: (err) => {
        this.isLoadingPosFormItem.set(false);
        this.toastr.error(`${err.error.message}`, 'Oupss!');
        console.log(err);
      }
    });
  }

  // PosFormItem Create
  onSubmitItem(): void {
    if (this.formGroupPosFormItem().valid && this.brandUUID()) {
      this.isLoadingPosFormItem.set(true);

      const itemData = {
        ...this.formGroupPosFormItem().value,
        posform_uuid: this.idItem(),
        brand_uuid: this.brandUUID(),
        brand_name: this.brandName()
      };

      this.posformItemService.create(itemData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          this.toastr.success('Marque ajoutée avec succès!', 'Succès');
          this.getAllPosFormItem(this.idItem()); // Rafraîchir la liste
          this.formGroupPosFormItem().reset();
          this.formGroupPosFormItem().patchValue({ sold: 0 });
          this.brandUUID.set('');
          this.brandName.set('');

          // Vider le champ de l'autocomplete brand
          if (this.brand_uuid && this.brand_uuid.nativeElement) {
            this.brand_uuid.nativeElement.value = '';
          }

          this.isLoadingPosFormItem.set(false);
        },
        error: (err) => {
          this.isLoadingPosFormItem.set(false);
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
      this.posformItemService.delete(uuid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastr.success('Marque supprimée avec succès!', 'Succès');
          this.getAllPosFormItem(this.idItem()); // Rafraîchir la liste
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
    if (this.formGroup().valid) {
      this.isLoading.set(true);

      const formData = {
        price: parseInt(this.formGroup().value.price) || 100,
        comment: this.formGroup().value.comment || '',
      };

      this.posformService.update(this.idItem(), formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          this.logActivity.activity(
            'PosForm',
            this.currentUser().uuid,
            'updated',
            `Updated PosForm uuid: ${this.idItem()}`,
            this.currentUser().fullname
          ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              this.toastr.success('Rapport modifié avec succès!', 'Succès');
              this.fetchProducts(this.posUUId);
              this.isLoading.set(false);
            },
            error: (err) => {
              this.isLoading.set(false);
              this.toastr.error('Erreur lors de la sauvegarde du log', 'Erreur');
              console.error(err);
            }
          });
        },
        error: (err) => {
          this.isLoading.set(false);
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
    return this.filteredDataList().length;
  }

  /**
   * Méthode helper pour mettre à jour un filtre spécifique
   */
  updateFilter(key: string, value: any): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }
}

