import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProvinceService } from '../../../territories/province/province.service';
import { NdService } from '../../services/nd.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { IProvince } from '../../../territories/province/models/province.model';
import { TableViewModel, NDBarChartAreaModel } from '../../models/dashboard.models';
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
  data: TableViewModel[];
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
  selector: 'app-nd-table-view-area',
  standalone: false,
  templateUrl: './nd-table-view-area.component.html',
  styleUrl: './nd-table-view-area.component.scss'
})
export class NdTableViewAreaComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  province!: IProvince

  tableViewList: TableViewModel[] = [];
  ndBarChartAreaList: NDBarChartAreaModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | any;

  constructor(
    private route: ActivatedRoute, 
    private _formBuilder: FormBuilder,
    private ndService: NdService,
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
      console.log('ProvinceUUid:', province_uuid);
      this.provinceService.getBy(province_uuid).subscribe((res) => {
        this.province = res.data; 
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
    this.ndService.NdTableViewArea(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      console.log('Table View List:', this.tableViewList);
      this.isLoading = false;
    });

    // Récupérer les données pour le graphique en barres
    this.getBarChartData(country_uuid, province_uuid, start_date, end_date);
  }

  getBarChartData(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.ndService.NdBarChartArea(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.ndBarChartAreaList = res.data;
      console.log('ndBarChartAreaList:', this.ndBarChartAreaList);
      this.generateBarChart();
    });
  }

  generateBarChart() {
    if (!this.ndBarChartAreaList || this.ndBarChartAreaList.length === 0) {
      return;
    }

    // Obtenir toutes les marques uniques
    const allBrands = Array.from(
      new Set(
        this.ndBarChartAreaList.flatMap(area => 
          area.brands.map(brand => brand.brand)
        )
      )
    );

    // Créer les séries pour chaque marque
    const series = allBrands.map(brandName => ({
      name: brandName,
      data: this.ndBarChartAreaList.map(area => {
        const brandData = area.brands.find(b => b.brand === brandName);
        return brandData ? brandData.pourcent : 0;
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
        categories: this.ndBarChartAreaList.map(area => area.name),
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
    }, {} as { [key: string]: TableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule la présence totale pour une area
   */
  getTotalPresence(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.presence, 0);
  }

  /**
   * Calcule le total des visites pour une area
   */
  getTotalVisits(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.visits, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une area
   */
  getMaxPercentage(data: TableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.pourcent));
  }

  /**
   * Compte le nombre de brands uniques pour une area
   */
  getUniqueBrands(data: TableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand));
    return uniqueBrands.size;
  }

}
