import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../territories/province/models/province.model';
import { SOSTableViewModel, SOSBarChartAreaModel } from '../../models/dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { SosService } from '../../services/sos.service';
import { ProvinceService } from '../../../territories/province/province.service';
import { formatDate } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';

interface AreaGroup {
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
  selector: 'app-sos-table-view-area',
  standalone: false,
  templateUrl: './sos-table-view-area.component.html',
  styleUrl: './sos-table-view-area.component.scss'
})
export class SosTableViewAreaComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  province!: IProvince

  tableViewList: SOSTableViewModel[] = [];
  sosBarChartAreaList: SOSBarChartAreaModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | any;

  constructor(
    private route: ActivatedRoute,
    private _formBuilder: FormBuilder,
    private sosService: SosService,
    private provinceService: ProvinceService,
  ) { }


  ngOnInit(): void {
    this.isLoading = true;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      rangeValue: new FormControl(this.rangeDate),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');

    this.route.params.subscribe(params => {
      const province_uuid = params['province_uuid'];
      console.log('Province UUID:', province_uuid);
      this.provinceService.getBy(province_uuid).subscribe((res) => {
        this.province = res.data;
        console.log('Province:', this.province);
        this.getTableArea(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
        this.isLoading = false;
      });
    });

    this.onChanges();
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      this.getTableArea(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);

    });
  }


  getTableArea(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.sosService.SOSTableViewArea(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      this.isLoading = false;
    });

    // Récupérer les données pour le graphique en barres
    this.getBarChartData(country_uuid, province_uuid, start_date, end_date);
  }

  getBarChartData(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.sosService.SosBarChartArea(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.sosBarChartAreaList = res.data;
      console.log('sosBarChartAreaList:', this.sosBarChartAreaList);
      this.generateBarChart();
    });
  }

  generateBarChart() {
    if (!this.sosBarChartAreaList || this.sosBarChartAreaList.length === 0) {
      return;
    }

    // Obtenir toutes les marques uniques
    const allBrands = Array.from(
      new Set(
        this.sosBarChartAreaList.flatMap(area => 
          area.brands.map(brand => brand.brand_name)
        )
      )
    );

    // Créer les séries pour chaque marque
    const series = allBrands.map(brandName => ({
      name: brandName,
      data: this.sosBarChartAreaList.map(area => {
        const brandData = area.brands.find(b => b.brand_name === brandName);
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
        categories: this.sosBarChartAreaList.map(area => area.name),
        title: {
          text: 'Areas'
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
   * Groupe les données par area
   */
  getGroupedData(): AreaGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const areaName = item.name;
      if (!acc[areaName]) {
        acc[areaName] = [];
      }
      acc[areaName].push(item);
      return acc;
    }, {} as { [key: string]: SOSTableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule la présence totale pour une area
   */
  getTotalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_farde, 0);
  }

  /**
   * Calcule le total global des fardes pour une area
   */
  getTotalGlobalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_global_farde, 0);
  }

  /**
   * Calcule le total des POS pour une area
   */
  getTotalPOS(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_pos, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une area
   */
  getMaxPercentage(data: SOSTableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.percentage));
  }

  /**
   * Compte le nombre de brands uniques pour une area
   */
  getUniqueBrands(data: SOSTableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand_name));
    return uniqueBrands.size;
  }

}
