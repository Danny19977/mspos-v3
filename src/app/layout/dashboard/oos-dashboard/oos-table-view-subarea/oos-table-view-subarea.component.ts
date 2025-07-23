import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms'; 
import { TableViewModel, NDBarChartSubAreaModel } from '../../models/dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { NdService } from '../../services/nd.service';
import { formatDate } from '@angular/common';
import { IArea } from '../../../territories/areas/models/area.model';
import { AreaService } from '../../../territories/areas/area.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';

interface SubareaGroup {
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
  selector: 'app-oos-table-view-subarea',
  standalone: false,
  templateUrl: './oos-table-view-subarea.component.html',
  styleUrl: './oos-table-view-subarea.component.scss'
})
export class OosTableViewSubareaComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  area!: IArea;

  tableViewList: TableViewModel[] = [];
  ndBarChartSubAreaList: NDBarChartSubAreaModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | any;

  constructor(
    private route: ActivatedRoute, 
    private _formBuilder: FormBuilder,
    private ndService: NdService,
    private areaService: AreaService,
  ) { }


  ngOnInit(): void {
    this.isLoading = true;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({ 
      rangeValue: new FormControl(this.rangeDate),
      area: new FormControl(''),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');
    
    this.route.params.subscribe(params => {
      const areaName = params['area_name'];
      console.log('areaName Name:', areaName);
      this.areaService.getBy(areaName).subscribe((res) => {
        this.area = res.data;
        console.log('area:', this.area);
        this.getTableViewSubArea(this.area.country_uuid, this.area.province_uuid, this.area.uuid, this.start_date, this.end_date);
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

      this.getTableViewSubArea(this.area.country_uuid, this.area.province_uuid, this.area.uuid, this.start_date, this.end_date);
     
    });
  }



  getTableViewSubArea(country_uuid: string, province_uuid: string, area_uuid: string, start_date: string, end_date: string) {
    this.ndService.NdTableViewSubArea(country_uuid, province_uuid, area_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      this.isLoading = false;
    });

    // Récupérer les données pour le graphique en barres
    this.getBarChartData(country_uuid, province_uuid, area_uuid, start_date, end_date);
  }

  getBarChartData(country_uuid: string, province_uuid: string, area_uuid: string, start_date: string, end_date: string) {
    this.ndService.NdBarChartSubArea(country_uuid, province_uuid, area_uuid, start_date, end_date).subscribe((res) => {
      this.ndBarChartSubAreaList = res.data;
      console.log('ndBarChartSubAreaList:', this.ndBarChartSubAreaList);
      this.generateBarChart();
    });
  }

  generateBarChart() {
    if (!this.ndBarChartSubAreaList || this.ndBarChartSubAreaList.length === 0) {
      return;
    }

    // Obtenir toutes les marques uniques
    const allBrands = Array.from(
      new Set(
        this.ndBarChartSubAreaList.flatMap(subarea => 
          subarea.brands.map(brand => brand.brand)
        )
      )
    );

    // Créer les séries pour chaque marque (avec valeurs inversées)
    const series = allBrands.map(brandName => ({
      name: brandName,
      data: this.ndBarChartSubAreaList.map(subarea => {
        const brandData = subarea.brands.find(b => b.brand === brandName);
        const originalValue = brandData ? brandData.pourcent : 0;
        // Inverser la valeur: 100 - valeur originale
        return 100 - originalValue;
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
        categories: this.ndBarChartSubAreaList.map(subarea => subarea.name),
        title: {
          text: 'Sub-Areas'
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
   * Groupe les données par subarea
   */
  getGroupedData(): SubareaGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const subareaName = item.name;
      if (!acc[subareaName]) {
        acc[subareaName] = [];
      }
      acc[subareaName].push(item);
      return acc;
    }, {} as { [key: string]: TableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule la présence totale pour une subarea
   */
  getTotalPresence(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.presence, 0);
  }

  /**
   * Calcule le total des visites pour une subarea
   */
  getTotalVisits(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.visits, 0);
  }

  /**
   * Calcule le pourcentage de rupture total pour une subarea
   */
  getTotalOOSPercentage(data: TableViewModel[]): number {
    const totalVisits = this.getTotalVisits(data);
    const totalPresence = this.getTotalPresence(data);
    if (totalVisits === 0) return 0;
    return ((totalVisits - totalPresence) * 100 / totalVisits);
  }

  /**
   * Calcule la rupture de stock en chiffre pour une subarea
   */
  getTotalOOSNumber(data: TableViewModel[]): number {
    return this.getTotalVisits(data) - this.getTotalPresence(data);
  }

  /**
   * Compte le nombre de brands uniques pour une subarea
   */
  getUniqueBrands(data: TableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand));
    return uniqueBrands.size;
  }

  /**
   * Trouve le pourcentage de rupture maximum pour une subarea
   */
  getMaxOOSPercentage(data: TableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => 
      item.visits > 0 ? ((item.visits - item.presence) * 100 / item.visits) : 0
    ));
  }

}


