import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
 
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { PerfVisitModel, SumChartBarModel } from '../../models/summary-dashboard.model';

export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any; 
}
 
@Component({
  selector: 'app-sumary-chart-bar',
  standalone: false,
  templateUrl: './sumary-chart-bar.component.html',
  styleUrl: './sumary-chart-bar.component.scss'
})
export class SumaryChartBarComponent implements OnChanges {
  @Input() isLoading!: boolean;
  @Input() summaryChartList: SumChartBarModel[] = [];

  // sumChartList: SumChartBarModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions3: Partial<ChartOptions> | any;

 

  ngOnChanges(changes: SimpleChanges): void {
    // this.sumChartList = this.summaryChartList;
    this.getChart();
  }

  getChart() {
    this.chartOptions3 = {
      series: [{
        name: 'Numeric distribution',
        data: this.summaryChartList.map((val) => {
          return val.Nd;
        }),
      },
      {
        name: 'Share of stock',
        data: this.summaryChartList.map((val => {
          return val.Sos;
        })),
      }, 
      {
        name: 'Out of stock',
        data: this.summaryChartList.map((val => {
          return val.Oos;
        })),
      }, 
      ],
      colors: ['#00E396', '#FF4560', '#008FFB'],
      chart: {
        height: 270,
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

      xaxis: {
        categories: this.summaryChartList.map((val => {
          return val.Province;
        })),
        // categories: ['Kinshasa', 'Province orientale', 'Kongo central', 'Grand bandundu', 'Katanga', 'Maniema', 'Grand kivu', 'Tshikapa', 'Kananga', 'Kasai oriental'],
      },
    };
  }
}
