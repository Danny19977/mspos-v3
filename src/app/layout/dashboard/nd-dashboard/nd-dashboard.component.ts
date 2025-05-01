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
import { ApiResponseNdDashboard, ApiResponseNdDashboardTotalByMonth } from '../../../shared/model/api-response.model';


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



  provinceList: IProvince[] = [];
  province!: IProvince;

  tableViewList: TableViewModel[] = [];
  ndYearList: any[] = [];


  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );


  constructor(
    private common: CommonService,
    private _formBuilder: FormBuilder,
    private renderer: Renderer2,
    private ndService: NdService,
    private countryService: CountryService,
    private provinceService: ProvinceService,
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
      rangeValue: new FormControl(this.rangeDate),
      country_uuid: new FormControl(''),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');


    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;

        this.countryService.getAll().subscribe((res) => {
          this.countryList.set(res.data); 
          this.provinceService.getAll().subscribe((pr) => {
            this.provinceList = pr.data; 
            if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
              this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
              this.getNDYear(this.countryList()[0].uuid);
            } else {
              this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
              this.getNDYear(this.currentUser.country_uuid);
            }
          });
        }); 

      },
      error: (error) => {
        console.log(error);
      }
    });

    this.onChanges();
  }


  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.countrySearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  onCheckboxCountryChange(event: any, item: ICountry) {
    if (event.target.checked) {
      console.log('item:', item);
      this.getTableView(item.uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
    }
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      console.log('val:', val);


      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');
 

      if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
        this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
      } else {
        this.getTableView(val.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
      }
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


  onProvinceChange(event: any) {
    this.isLoading = true;
    this.province = event.value;
    console.log('province:', this.province);
    this.getTableView(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
  }


  getTableView(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.ndService.NdTableViewProvince(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      this.isLoading = false;
    });
  } 


  getNDYear(country_uuid: string) {
    const year = new Date().getFullYear();
    this.ndService.NdTotalByBrandByMonth(country_uuid, year.toString()).subscribe((res) => {
      console.log('getNDYear res:', res);
      this.ndYearList = res.data;
      this.isLoading = false;
    });
  }
}
