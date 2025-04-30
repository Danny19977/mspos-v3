import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { NDYearModel } from '../../models/nd-dashboard.models';

export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}


@Component({
  selector: 'app-sos-by-year',
  standalone: false,
  templateUrl: './sos-by-year.component.html',
  styleUrl: './sos-by-year.component.scss'
})
export class SosByYearComponent implements OnChanges {
  @Input() isLoading!: boolean;
  @Input() sosYear: NDYearModel[] = [];

  sosYearList: NDYearModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions4: Partial<ChartOptions> | any;


  ngOnChanges(changes: SimpleChanges): void {
    this.sosYearList = this.sosYear;
    this.getChartByYear();
  }


  getChartByYear() {
    this.chartOptions4 = {
      series: [
        // {
        //   name: 'Equateur',
        //   data: this.sosYearList.map((val) => {
        //     return val.Eq;
        //   }),
        // },
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
        categories: this.sosYearList.map((val) => {
          // if (val.Month == '1') {
          //   return 'Jan';
          // } else if (val.Month == '2') {
          //   return 'Feb';
          // } else if (val.Month == '3') {
          //   return 'Mar';
          // } else if (val.Month == '4') {
          //   return 'Apr';
          // } else if (val.Month == '5') {
          //   return 'Mai';
          // } else if (val.Month == '6') {
          //   return 'Juin';
          // } else if (val.Month == '7') {
          //   return 'Juil';
          // } else if (val.Month == '8') {
          //   return 'Aout';
          // } else if (val.Month == '9') {
          //   return 'Sep';
          // } else if (val.Month == '10') {
          //   return 'Oct';
          // } else if (val.Month == '11') {
          //   return 'Nov';
          // } else if (val.Month == '12') {
          //   return 'Dec';
          // } else {
          //   return "";
          // }
        }),
      },
    };
  }
}

