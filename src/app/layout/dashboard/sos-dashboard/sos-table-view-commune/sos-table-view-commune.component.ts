import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SOSTableViewModel, SOSBarChartCommuneModel } from '../../models/dashboard.models';
import { SosService } from '../../services/sos.service'; 
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ISubArea } from '../../../territories/subarea/models/subarea.model';
import { SubareaService } from '../../../territories/subarea/subarea.service';
import { 
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ChartComponent,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend
} from 'ng-apexcharts';

interface CommuneGroup {
  name: string;
  data: SOSTableViewModel[];
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
};

@Component({
  selector: 'app-sos-table-view-commune',
  standalone: false,
  templateUrl: './sos-table-view-commune.component.html',
  styleUrl: './sos-table-view-commune.component.scss'
})
export class SosTableViewCommuneComponent implements OnInit {
  isLoading = false;
  
    dateRange!: FormGroup;
    start_date!: string;
    end_date!: string;
  
    // Filtre 
    rangeDate: any[] = [];
  
    subarea!: ISubArea;
  
    tableViewList: SOSTableViewModel[] = [];
    
    // Bar Chart
    @ViewChild("chart") chart!: ChartComponent;
    public chartOptions!: Partial<ChartOptions>;
    barChartData: SOSBarChartCommuneModel[] = [];
    isLoadingChart = false; 
  
    constructor(
      private route: ActivatedRoute, 
      private _formBuilder: FormBuilder,
      private sosService: SosService,
      private subareaService: SubareaService,
    ) { }
  
  
    ngOnInit(): void {
      this.isLoading = true;
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      this.rangeDate = [firstDay, lastDay];
  
      this.dateRange = this._formBuilder.group({ 
        rangeValue: new FormControl(this.rangeDate),
        subarea: new FormControl(''),
      });
      this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
      this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');
      
      this.route.params.subscribe(params => {
        const subarea_uuid = params['subarea_uuid']; 
        this.subareaService.getBy(subarea_uuid).subscribe((res) => {
          this.subarea = res.data;
          console.log('subarea:', this.subarea);
          this.getTableViewCommune(this.subarea.country_uuid, this.subarea.province_uuid, this.subarea.area_uuid, this.subarea.uuid, this.start_date, this.end_date);
          this.getBarChartData(this.subarea.country_uuid, this.subarea.province_uuid, this.subarea.area_uuid, this.subarea.uuid, this.start_date, this.end_date);
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
  
        this.getTableViewCommune(this.subarea.country_uuid, this.subarea.province_uuid, this.subarea.area_uuid, this.subarea.uuid, this.start_date, this.end_date);
        this.getBarChartData(this.subarea.country_uuid, this.subarea.province_uuid, this.subarea.area_uuid, this.subarea.uuid, this.start_date, this.end_date);
       
      });
    }
  
    getTableViewCommune(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string, start_date: string, end_date: string) {
      this.sosService.SOSTableViewCommune(country_uuid, province_uuid, area_uuid, sub_area_uuid, start_date, end_date).subscribe((res) => {
        this.tableViewList = res.data;
        this.isLoading = false;
      });
    }

  /**
   * Groupe les données par commune
   */
  getGroupedData(): CommuneGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const communeName = item.name;
      if (!acc[communeName]) {
        acc[communeName] = [];
      }
      acc[communeName].push(item);
      return acc;
    }, {} as { [key: string]: SOSTableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule le total des fardes pour une commune
   */
  getTotalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_farde, 0);
  }

  /**
   * Calcule le total global des fardes pour une commune
   */
  getTotalGlobalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_global_farde, 0);
  }

  /**
   * Calcule le total des POS pour une commune
   */
  getTotalPOS(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_pos, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une commune
   */
  getMaxPercentage(data: SOSTableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.percentage));
  }

  /**
   * Compte le nombre de brands uniques pour une commune
   */
  getUniqueBrands(data: SOSTableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand_name));
    return uniqueBrands.size;
  }

  /**
   * Récupère les données pour le graphique barres SOS Commune
   */
  getBarChartData(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string, start_date: string, end_date: string) {
    this.isLoadingChart = true;
    this.sosService.SosBarChartCommune(country_uuid, province_uuid, area_uuid, sub_area_uuid, start_date, end_date).subscribe((res) => {
      this.barChartData = res.data;
      this.generateBarChart();
      this.isLoadingChart = false;
    });
  }

  /**
   * Génère le graphique en barres pour SOS Commune
   */
  generateBarChart() {
    const colors = [
      '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
      '#00D9FF', '#FF66C4', '#FFAA44', '#C7F464', '#FFB84D',
      '#FF6B9D', '#7B68EE', '#32CD32', '#FF1493', '#00CED1',
      '#FF8C00', '#9370DB', '#20B2AA', '#FF69B4', '#1E90FF'
    ];

    const series = this.barChartData.map((commune, index) => ({
      name: commune.name,
      data: commune.brands.map(brand => brand.percentage),
      color: colors[index % colors.length]
    }));

    const categories = this.barChartData.length > 0 
      ? this.barChartData[0].brands.map(brand => brand.brand_name)
      : [];

    this.chartOptions = {
      series: series,
      chart: {
        type: "bar",
        height: 450,
        stacked: false,
        toolbar: {
          show: true
        }
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Marques',
          style: {
            fontSize: '14px',
            fontWeight: 600
          }
        }
      },
      yaxis: {
        title: {
          text: 'Pourcentage (%)',
          style: {
            fontSize: '14px',
            fontWeight: 600
          }
        },
        labels: {
          formatter: (val: number) => `${val.toFixed(2)}%`
        }
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        y: {
          formatter: function (val: any) {
            return val.toFixed(2) + "%";
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center'
      },
      title: {
        text: 'Graphique SOS par Commune',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 600
        }
      }
    };
  }

}

