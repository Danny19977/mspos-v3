import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
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

import { PriceSaleModel } from '../../models/summary-dashboard.model';

@Component({
  selector: 'app-price-sale',
  standalone: false,
  templateUrl: './price-sale.component.html',
  styleUrl: './price-sale.component.scss'
})
export class PriceSaleComponent implements OnChanges {


  @Input() isLoading!: boolean;
  @Input() priceSaleLIst: PriceSaleModel[] = [];

  priceSaleData: PriceSaleModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions3: Partial<ChartOptions> | any;  
 
  ngOnChanges(changes: SimpleChanges): void {
    // this.priceSaleData = this.priceSaleLIst;
    this.getChart();
  }

  getChart() {
    this.chartOptions3 = {
      series: this.priceSaleLIst.map((val) => val.Count),
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
      colors: this.priceSaleLIst.map((val) => {
        if (val.Price == '100') {
          return '#00E396';
        } else if (val.Price == '150') {
          return '#FF4560'
        } else {
          return ''
        }
      }),
      labels: this.priceSaleLIst.map((val) => `${val.Price}FC`),
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
