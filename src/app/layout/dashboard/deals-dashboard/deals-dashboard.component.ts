/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Renderer2, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { routes } from '../../../shared/routes/routes';
import { CommonService } from '../../../shared/common/common.service';
export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}
@Component({
  selector: 'app-deals-dashboard',
  standalone: false,
  templateUrl: './deals-dashboard.component.html',
  styleUrl: './deals-dashboard.component.scss',
})
export class DealsDashboardComponent {
  public routes =  routes
  bsValue = new Date();
  bsRangeValue: Date[];
  maxDate = new Date();
  base = '';
  page = '';
  last = '';
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptions> | any;
  public chartOptions3: Partial<ChartOptions> | any;
  public chartOptions4: Partial<ChartOptions> | any;

  constructor( private common: CommonService, private renderer: Renderer2,) {
    this.chartOptions = {
      series: [
        {
          data: [400, 220, 448],
          color: '#FC0027',
        },
      ],
      chart: {
        type: 'bar',
        height: 150,
      },
      plotOptions: {
        bar: {
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: false,
      },

      xaxis: {
        categories: ['Conversation', 'Follow Up', 'Inpipeline'],
      },
    };
    this.chartOptions2 = {
      series: [
        {
          data: [400, 220, 448],
          color: '#77D882',
        },
      ],
      chart: {
        type: 'bar',
        height: 150,
      },
      plotOptions: {
        bar: {
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: false,
      },

      xaxis: {
        categories: ['Conversation', 'Follow Up', 'Inpipeline'],
      },
    };
    this.chartOptions3 = {
      series: [
        {
          name: 'sales',
          colors: ['#FFC38F'],
          data: [
            {
              x: 'Inpipeline',
              y: 400,
            },
            {
              x: 'Follow Up',
              y: 130,
            },
            {
              x: 'Schedule',
              y: 248,
            },
            {
              x: 'Conversation',
              y: 470,
            },
            {
              x: 'Won',
              y: 470,
            },
            {
              x: 'Lost',
              y: 180,
            },
          ],
        },
      ],
      colors: ['#00918E'],
      chart: {
        type: 'bar',
        height: 275,
      },
      plotOptions: {
        bar: {
          borderRadiusApplication: 'around',
          columnWidth: '40%',
        },
      },

      xaxis: {
        type: 'category',
        group: {
          style: {
            fontSize: '7px',
            fontWeight: 700,
          },
        },
      },
      yaxis: {
        min: 0,  
        max: 500,  
        tickAmount: 5,  
      }
    };
    this.chartOptions4 = {
      series: [
        {
          name: 'Deals',
          data: [10, 20, 30, 15, 22, 40, 30, 20, 30, 18, 30, 60],
        },
      ],
      colors: ['#E41F07'],
      chart: {
        height: 273,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'straight',
      },
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
      },
    };
    this.maxDate.setDate(this.maxDate.getDate() + 7);
    this.bsRangeValue = [this.bsValue, this.maxDate];
    this.common.base.subscribe((base: string) => {
      this.base = base;
    });
    this.common.page.subscribe((page: string) => {
      this.page = page;
    });
    this.common.last.subscribe((last: string) => {
      this.last = last;
    });
    if (this.page == 'deals-dashboard') {
      this.renderer.addClass(document.body, 'date-picker-dashboard');
    }
  }
 
}
