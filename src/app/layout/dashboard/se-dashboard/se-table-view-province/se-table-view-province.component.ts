import { Component, computed, OnInit, signal } from '@angular/core';
import { IUser } from '../../../user/models/user.model';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../province/models/province.model';
import { SETableViewModel, SETableViewPriceModel } from '../../models/dashboard.models';
import { ICountry } from '../../../country/models/country.model';
import { CountryService } from '../../../country/country.service';
import { ProvinceService } from '../../../province/province.service';
import { AuthService } from '../../../../auth/auth.service';
import { SaleEvolutionService } from '../../services/sale-evolution.service';
import { formatDate } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart, 
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';


export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}

@Component({
  selector: 'app-se-table-view-province',
  standalone: false,
  templateUrl: './se-table-view-province.component.html',
  styleUrl: './se-table-view-province.component.scss'
})
export class SeTableViewProvinceComponent implements OnInit {
  isLoading = false;
  currentUser!: IUser;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre
  rangeDate: any[] = [];


  provinceList: IProvince[] = [];
  province!: IProvince;

  tableViewList: SETableViewModel[] = [];
  tableViewPriceList: SETableViewPriceModel[] = [];


  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );
  selectedProvince: string | null = null; // Declare the property with an initial value

  public chartOptions3: Partial<ChartOptions> | any;
  public chartOptions4: Partial<ChartOptions> | any;

  constructor(
    private _formBuilder: FormBuilder,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private authService: AuthService,
    private saleEvolutionService: SaleEvolutionService,
  ) {
  }


  ngOnInit(): void {
    this.isLoading = true;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      country: new FormControl(''),
      rangeValue: new FormControl(this.rangeDate),
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
              this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid);
              this.getTableViewPrice(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
            } else {
              this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid);
              this.getTableViewPrice(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
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
      this.getTableView(item.uuid, this.provinceList[0].uuid);
      this.getTableViewPrice(item.uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
    }
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
        this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid);
        this.getTableViewPrice(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
      } else {
        this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid);
        this.getTableViewPrice(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
      }
    });
  }


  onProvinceChange(event: any) {
    this.isLoading = true;
    this.province = event.value;
    console.log('province:', this.province);
    this.getTableView(this.province.country_uuid, this.province.uuid);
    this.getTableViewPrice(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
  }


  getTableView(country_uuid: string, province_uuid: string) {
    this.saleEvolutionService.TableViewProvince(country_uuid, province_uuid).subscribe((res) => {
      this.tableViewList = res.data;
      this.getPieChartData();
      this.isLoading = false;
    });
  }

  getTableViewPrice(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.saleEvolutionService.TableViewProvincePrice(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewPriceList = res.data;
      this.getPieChartDataPrix();
      this.isLoading = false;
    });
  }

  getPieChartData() { 
    const series = (this.tableViewList || []).map((item) => item.total_pos);
    const labels = (this.tableViewList || []).map((item) => item.type_pos);

    console.log('series:', series);
    console.log('labels:', labels);

    this.chartOptions3 = {
      series: series,
      chart: {
        width: 400,
        type: 'pie',
      },
      legend: {
        position: 'bottom',
        formatter: function (val: any, opts: any) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex];
        },
      },
      labels: labels,
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 275,
            },
            legend: {
              position: 'right',
            },
          },
        },
      ],
    };
  }

  getPieChartDataPrix() {
    const series = (this.tableViewPriceList || []).map((item) => item.count_price);
    const labels = (this.tableViewPriceList || []).map((item) => item.price);

    this.chartOptions4 = {
      series: series,
      chart: {
        width: 400,
        type: 'pie',
      },
      legend: {
        position: 'bottom',
        formatter: function (val: any, opts: any) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex];
        },
      },
      labels: labels,
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 275,
            },
            legend: {
              position: 'right',
            },
          },
        },
      ],
    };
  }
}
