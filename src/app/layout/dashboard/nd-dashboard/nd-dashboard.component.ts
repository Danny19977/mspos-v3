import { ChangeDetectionStrategy, Component, computed, effect, OnInit, Renderer2, signal } from '@angular/core';
import { routes } from '../../../shared/routes/routes';
import { ProvinceService } from '../../province/province.service';
import { AreaService } from '../../areas/area.service';
import { CommonService } from '../../../shared/common/common.service';
import { IProvince, IProvinceDropdown } from '../../province/models/province.model';
import { IArea, IAreaDropdown } from '../../areas/models/area.model';
import { NdService } from '../services/nd.service';
import { formatDate } from '@angular/common';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NDYearModel, TableViewModel } from '../models/nd-dashboard.models';
import { AuthService } from '../../../auth/auth.service';
import { IUser } from '../../user/models/user.model';
import { CountryService } from '../../country/country.service';
import { ISubArea } from '../../subarea/models/subarea.model';
import { ICommune } from '../../commune/models/commune.model';
import { ICountry } from '../../country/models/country.model';
import { SubareaService } from '../../subarea/subarea.service';
import { CommuneService } from '../../commune/commune.service';


@Component({
  selector: 'app-nd-dashboard',
  standalone: false,
  templateUrl: './nd-dashboard.component.html',
  styleUrl: './nd-dashboard.component.scss',
})
export class NdDashboardComponent implements OnInit {
  public routes = routes;
  base = '';
  page = '';
  last = '';

  isLoading = false;
  currentUser!: IUser;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];
  provinceDropdownList: IProvinceDropdown[] = [];
  provinceDropdown!: IProvinceDropdown;
  areaList: IAreaDropdown[] = [];
  areaListFilter: IAreaDropdown[] = [];
  area!: IAreaDropdown;
  areaCount = 1; // For found length area for divide by ND


  tableViewData: TableViewModel[] = [];
  tableViewList: TableViewModel[] = [];
  averageAreaData: TableViewModel[] = [];
  averageAreaList: TableViewModel[] = [];
  performanceAreaData: TableViewModel[] = [];
  performanceAreaList: TableViewModel[] = [];
  ndYearList: NDYearModel[] = [];


  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );

  provinceSearch = signal<string>('');
  provinceList = signal<IProvince[]>([]);
  filteredProvinceList = computed(() =>
    this.provinceList().filter((province) =>
      province.name.toLowerCase().includes(this.provinceSearch().toLowerCase())
    )
  );
 
  

  areaSearch = signal<string>('');
  areasList = signal<IArea[]>([]);
  filteredAreaList = computed(() =>
    this.areasList().filter((area) =>
      area.name.toLowerCase().includes(this.areaSearch().toLowerCase())
    )
  );
   

  subAreaSearch = signal<string>('');
  subAreaList = signal<ISubArea[]>([]);
  filteredSubAreaList = computed(() =>
    this.subAreaList().filter((subarea) =>
      subarea.name.toLowerCase().includes(this.subAreaSearch().toLowerCase())
    )
  );
   

  communeSearch = signal<string>('');
  communeList = signal<ICommune[]>([]);
  filteredCommuneList = computed(() =>
    this.communeList().filter((commune) =>
      commune.name.toLowerCase().includes(this.communeSearch().toLowerCase())
    )
  );

  constructor(
    private common: CommonService,
    private _formBuilder: FormBuilder,
    private renderer: Renderer2,
    private ndService: NdService,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private areaService: AreaService,
    private subAreaService: SubareaService,
    private communeService: CommuneService,
    private authService: AuthService,
  ) {

    this.common.base.subscribe((base: string) => {
      this.base = base;
    });
    this.common.page.subscribe((page: string) => {
      this.page = page;
    });
    this.common.last.subscribe((last: string) => {
      this.last = last;
    });
    if (this.last == 'nd-dashboard') {
      this.renderer.addClass(document.body, 'date-picker-dashboard');
    }
  }


  ngOnInit(): void {
    this.isLoading = true;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      province: new FormControl(this.provinceDropdown),
      rangeValue: new FormControl(this.rangeDate),
      area: new FormControl(''),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');


    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;

        this.countryService.getAll().subscribe((res) => {
          this.countryList.set(res.data);
        })
        this.provinceService.getAll().subscribe((res) => {
          this.provinceList.set(res.data);
        });
        this.areaService.getAll().subscribe((res) => {
          this.areasList.set(res.data);
        });
        this.subAreaService.getAll().subscribe((res) => {
          this.subAreaList.set(res.data);
        });
        this.communeService.getAll().subscribe((res) => {
          this.communeList.set(res.data);
        });

        // Exemple d'effet pour déboguer les changements
        effect(() => {
          console.log('Filtered Countries:', this.filteredCountryList());
        });
        effect(() => {
          console.log('Filtered Provinces:', this.filteredProvinceList());
        });
        effect(() => {
          console.log('Filtered Areas:', this.filteredAreaList());
        });
        effect(() => {
          console.log('Filtered Subareas:', this.filteredSubAreaList());
        });
        effect(() => {
          console.log('Filtered Communes:', this.filteredCommuneList());
        });


        if (this.currentUser.role != 'ASM') {
          this.provinceService.getProvinceDropdown().subscribe((res) => {
            this.provinceDropdownList = res.data;
            this.areaService.getAreaDropdown().subscribe((r) => {
              this.areaList = r.data;
              if (!this.provinceDropdown) {
                const dataList = this.provinceDropdownList.filter((v) => v.name == 'Kinshasa');
                const areaArray = this.areaList.filter((v) => v.province_uuid == dataList[0].uuid);
                this.areaListFilter = areaArray.filter((obj, index, self) =>
                  index === self.findIndex((t) => t.name === obj.name)
                );
                this.areaCount = this.areaListFilter.length; // Total Area par province selectionner 
              }
            });
          });
        } else if (this.currentUser.role == 'ASM') {
          this.provinceService.get(this.currentUser.province_uuid).subscribe((res) => {
            this.provinceDropdown = res.data;
          });
        }




   
        if (this.currentUser.role == 'ASM') {
          this.provinceService.get(this.currentUser.province_uuid).subscribe((res) => {
            this.provinceDropdown = res.data;
            if (this.start_date && this.end_date) {
              this.getTableView(this.provinceDropdown.name, this.start_date, this.end_date);
              this.getAverageArea(this.provinceDropdown.name, this.dateRange.value.area, this.start_date, this.end_date);
              this.getPerformance(this.provinceDropdown.name, this.start_date, this.end_date);
              this.getNDYear(this.provinceDropdown.name);
            }
          });

        } else {
          if (!this.provinceDropdown && this.start_date && this.end_date) {
            this.getTableView(this.dateRange.value.province, this.start_date, this.end_date);
            this.getAverageArea(this.dateRange.value.province, this.dateRange.value.area, this.start_date, this.end_date);
            this.getPerformance(this.dateRange.value.province, this.start_date, this.end_date);
            this.getNDYear(this.dateRange.value.province);
          }
        }

        this.onChanges();
      },
      error: (error) => {
        console.log(error);
      }
    });


  }


  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.countrySearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  updateProvinceSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.provinceSearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  updateAreaSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.areaSearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  updateSubAreaSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.subAreaSearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  updateCommuneSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.communeSearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  onCheckboxCountryChange(event: any, item: ICountry) {
    const checkArray: any = this.dateRange.get('area')?.value || [];
    if (event.target.checked) {
      checkArray.push(event.target.value);
      console.log('item:', item);
      
    } 
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe(val => {
      if (this.currentUser.role != 'ASM') {
        this.provinceDropdown = val.province;
      }

      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');
      this.area = val.area;


      const areaArray = this.areaList.filter((v) => v.province_uuid == this.provinceDropdown.uuid);
      this.areaListFilter = areaArray.filter((obj, index, self) =>
        index === self.findIndex((t) => t.name === obj.name)
      );
      this.areaCount = this.areaListFilter.length;

      this.getTableView(this.provinceDropdown.name, this.start_date, this.end_date);
      this.getAverageArea(this.provinceDropdown.name, this.area.name, this.start_date, this.end_date);
      this.getPerformance(this.provinceDropdown.name, this.start_date, this.end_date);
      this.getNDYear(this.provinceDropdown.name);
    });
  }


  getAverageArea(province: string, area: string, start_date: string, end_date: string) {
    this.ndService.tableView(province, start_date, end_date).subscribe((res) => {
      const dataList = res.data;
      if (dataList) {
        this.averageAreaData = dataList;
      }
      this.averageAreaList = this.averageAreaData.filter((val) => val.Area == area);

      this.isLoading = false;
    });
  }


  getNDYear(province: string) {
    this.ndService.NdByYear(province).subscribe((res) => {
      const dataList = res.data;
      if (dataList) {
        this.ndYearList = dataList;
      }
      this.isLoading = false;
    });
  }


  getPerformance(province: string, start_date: string, end_date: string) {
    this.ndService.tableView(province, start_date, end_date).subscribe((res) => {
      const dataList = res.data;
      if (dataList) {
        this.performanceAreaList = dataList;
      }
      this.isLoading = false;
    });
  }


  getTableView(province: string, start_date: string, end_date: string) {
    this.ndService.tableView(province, start_date, end_date).subscribe((res) => {
      const dataList = res.data;
      if (dataList) {
        this.tableViewList = dataList;
      }
      this.isLoading = false;
    });
  }



}
