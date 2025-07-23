import { Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { SosService } from '../../services/sos.service';
import { ProvinceService } from '../../../territories/province/province.service';
import { AuthService } from '../../../../auth/auth.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../territories/province/models/province.model';
import { IUser } from '../../../management/user/models/user.model';
import { formatDate } from '@angular/common';
import { SOSTableViewModel, SOSBarChartProvinceModel } from '../../models/dashboard.models';
import { ICountry } from '../../../territories/country/models/country.model';
import { CountryService } from '../../../territories/country/country.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';

interface ProvinceGroup {
  name: string;
  data: SOSTableViewModel[];
}

export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
  colors: any;
}

@Component({
  selector: 'app-sos-table-view-province',
  standalone: false,
  templateUrl: './sos-table-view-province.component.html',
  styleUrl: './sos-table-view-province.component.scss'
})
export class SosTableViewProvinceComponent implements OnInit {
  isLoading = false;
  currentUser!: IUser;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];



  provinceList: IProvince[] = [];
  province!: IProvince;

  tableViewList: SOSTableViewModel[] = [];
  sosBarChartProvinceList: SOSBarChartProvinceModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | any; 


  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );

  constructor( 
    private _formBuilder: FormBuilder, 
    private sosService: SosService,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private authService: AuthService,
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
              this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
            } else {
              this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
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
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
        this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
      } else {
        this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
      } 
    }); 
  }


  onProvinceChange(event: any) {
    this.isLoading = true;
    this.province = event.value;
    console.log('province:', this.province);
    this.getTableView(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
  }


  getTableView(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.sosService.SosTableViewProvince(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      console.log('tableViewList:', this.tableViewList);
      this.isLoading = false;
    });

    // Récupérer les données pour le graphique en barres
    this.getBarChartData(country_uuid, province_uuid, start_date, end_date);
  }

  getBarChartData(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.sosService.SosBarChartProvince(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.sosBarChartProvinceList = res.data;
      console.log('sosBarChartProvinceList:', this.sosBarChartProvinceList);
      this.generateBarChart();
    });
  }

  generateBarChart() {
    if (!this.sosBarChartProvinceList || this.sosBarChartProvinceList.length === 0) {
      return;
    }

    // Obtenir toutes les marques uniques
    const allBrands = Array.from(
      new Set(
        this.sosBarChartProvinceList.flatMap(province => 
          province.brands.map(brand => brand.brand_name)
        )
      )
    );

    // Créer les séries pour chaque marque
    const series = allBrands.map(brandName => ({
      name: brandName,
      data: this.sosBarChartProvinceList.map(province => {
        const brandData = province.brands.find(b => b.brand_name === brandName);
        return brandData ? brandData.percentage : 0;
      })
    }));

    // Couleurs attractives pour les marques
    const attractiveColors = [
      '#1E90FF', // Dodger Blue
      '#32CD32', // Lime Green
      '#FFD700', // Gold
      '#FF69B4', // Hot Pink
      '#8A2BE2', // Blue Violet
      '#00CED1', // Dark Turquoise
      '#FF4500', // Orange Red
      '#7FFF00', // Chartreuse
      '#DC143C', // Crimson
      '#00FA9A', // Medium Spring Green
      '#FF6347', // Tomato
      '#4682B4', // Steel Blue
      '#DA70D6', // Orchid
      '#40E0D0', // Turquoise
      '#FF8C00', // Dark Orange
      '#ADFF2F', // Green Yellow
      '#C71585', // Medium Violet Red
      '#20B2AA', // Light Sea Green
      '#FF1493', // Deep Pink
      '#7B68EE', // Medium Slate Blue
    ];

    this.chartOptions = {
      series: series,
      colors: attractiveColors.slice(0, allBrands.length),
      chart: {
        height: 350,
        type: 'bar',
        toolbar: {
          show: false,
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: this.sosBarChartProvinceList.map(province => province.name),
        title: {
          text: 'Provinces'
        }
      },
      yaxis: {
        title: {
          text: 'Pourcentage (%)'
        },
        labels: {
          formatter: (val: number) => `${val.toFixed(2)}%`
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(2)}%`
        }
      },
      legend: {
        position: 'top'
      }
    };
  }

  /**
   * Groupe les données par province
   */
  getGroupedData(): ProvinceGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const provinceName = item.name;
      if (!acc[provinceName]) {
        acc[provinceName] = [];
      }
      acc[provinceName].push(item);
      return acc;
    }, {} as { [key: string]: SOSTableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule le total des fardes pour une province
   */
  getTotalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_farde, 0);
  }

  /**
   * Calcule le total global des fardes pour une province
   */
  getTotalGlobalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_global_farde, 0);
  }

  /**
   * Calcule le total des POS pour une province
   */
  getTotalPOS(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_pos, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une province
   */
  getMaxPercentage(data: SOSTableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.percentage));
  }

  /**
   * Compte le nombre de brands uniques pour une province
   */
  getUniqueBrands(data: SOSTableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand_name));
    return uniqueBrands.size;
  }
}
