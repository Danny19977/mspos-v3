import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';  
import { SOSPieChartModel } from '../../models/sos-dashboard.models';
export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}

@Component({
  selector: 'app-sos-pie-chart',
  standalone: false,
  templateUrl: './sos-pie-chart.component.html',
  styleUrl: './sos-pie-chart.component.scss'
})
export class SosPieChartComponent implements OnChanges {
  @Input() isLoading!: boolean;
  @Input() sosPieLIst: SOSPieChartModel[] = [];

  sosPieData: SOSPieChartModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions3: Partial<ChartOptions> | any; 

  ngOnChanges(changes: SimpleChanges): void {
    this.sosPieData = this.sosPieLIst;
    this.getChart();
  }

  getChart() {
    this.chartOptions3 = {
      series: this.sosPieData.map((val) => val.Eq),
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
      labels: this.sosPieData.map((val) => val.Area),
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
