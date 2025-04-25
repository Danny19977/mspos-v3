import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { TableViewModel } from '../../models/nd-dashboard.models';
import { SOSAverageModel } from '../../models/sos-dashboard.models';

export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}



@Component({
  selector: 'app-sos-chart-bar',
  standalone: false,
  templateUrl: './sos-chart-bar.component.html',
  styleUrl: './sos-chart-bar.component.scss'
})
export class SosChartBarComponent implements OnChanges {
  @Input() sosAreaList: TableViewModel[] = [];
  @Input() isLoading!: boolean; 
  @Input() areaCount!: number

  sosDataList: SOSAverageModel[] = [];

  Eq = 0;
  Eq1 = 0;
  Dhl = 0;
  Dhl1 = 0;
  Ar = 0;
  Ar1 = 0;
  Sbl = 0;
  Sbl1 = 0;
  Pmf = 0;
  Pmf1 = 0;
  Pmm = 0;
  Pmm1 = 0;
  Ticket = 0;
  Ticket1 = 0;
  Mtc = 0;
  Mtc1 = 0;
  Ws = 0;
  Ws1 = 0;
  Mast = 0;
  Mast1 = 0;
  Oris = 0;
  Oris1 = 0;
  Elite = 0;
  Elite1 = 0;
  Yes = 0;
  Yes1 = 0;
  Time = 0;
  Time1 = 0;


  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions3: Partial<ChartOptions> | any;

  ngOnChanges(changes: SimpleChanges): void { 
    this.getSOSData();
    this.getBySOS(); 
  }

  getSOSData() {
    for (let index = 0; index < this.sosAreaList.length; index++) {
      this.Eq = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Eq;
      }, 0); 
      if (this.Eq > 0) {
        this.Eq1 = this.Eq / this.areaCount;
      } 
      this.Dhl = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Dhl;
      }, 0); 
      if (this.Dhl > 0) {
        this.Dhl1 = this.Dhl / this.areaCount;
      }  
      this.Ar = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Ar;

      }, 0); 
      if (this.Ar > 0) {
        this.Ar1 = this.Ar / this.areaCount;
      }
      this.Sbl = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Sbl;
      }, 0); 
      if (this.Sbl > 0) {
        this.Sbl1 = this.Sbl / this.areaCount;
      } 
      this.Pmf = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Pmf;
      }, 0); 
      if (this.Pmf > 0) {
        this.Pmf1 = this.Pmf / this.areaCount;
      } 
      this.Pmm = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Pmm;
      }, 0);
      if (this.Pmm > 0) {
        this.Pmm1 = this.Pmm / this.areaCount;
      } 
      this.Ticket = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Ticket;
      }, 0); 
      if (this.Ticket > 0) {
        this.Ticket1 = this.Ticket / this.areaCount;
      } 
      this.Mtc = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Mtc;
      }, 0); 
      if (this.Mtc > 0) {
        this.Mtc1 = this.Mtc / this.areaCount;
      } 
      this.Ws = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Ws;
      }, 0); 
      if (this.Ws > 0) {
        this.Ws1 = this.Ws / this.areaCount;
      } 
      this.Mast = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Mast;
      }, 0); 
      if (this.Mast > 0) {
        this.Mast1 = this.Mast / this.areaCount;
      } 
      this.Oris = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Oris;
      }, 0); 
      if (this.Oris > 0) {
        this.Oris1 = this.Oris / this.areaCount;
      } 
      this.Elite = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Elite;
      }, 0); 
      if (this.Elite > 0) {
        this.Elite1 = this.Elite / this.areaCount;
      } 
      this.Yes = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Yes;
      }, 0); 
      if (this.Yes > 0) {
        this.Yes1 = this.Yes / this.areaCount;
      } 
      this.Time = this.sosAreaList.reduce(function (sum, value) {
        return sum + value.Time;
      }, 0); 
      if (this.Time > 0) {
        this.Time1 = this.Time / this.areaCount;
      } 
    }

    this.sosDataList = []; 

    this.sosDataList.push({ x: 'Eq', y: this.Eq1 });
    this.sosDataList.push({ x: 'Dhl', y: this.Dhl1 });
    this.sosDataList.push({ x: 'Ar', y: this.Ar1 });
    this.sosDataList.push({ x: 'Sbl', y: this.Sbl1 });
    this.sosDataList.push({ x: 'Pmf', y: this.Pmf1 });
    this.sosDataList.push({ x: 'Pmm', y: this.Pmm1 });
    this.sosDataList.push({ x: 'Ticket', y: this.Ticket1 });
    this.sosDataList.push({ x: 'Mtc', y: this.Mtc1 });
    this.sosDataList.push({ x: 'Ws', y: this.Ws1 });
    this.sosDataList.push({ x: 'Mast', y: this.Mast1 });
    this.sosDataList.push({ x: 'Oris', y: this.Oris1 });
    this.sosDataList.push({ x: 'Elite', y: this.Elite1 });
    this.sosDataList.push({ x: 'Yes', y: this.Yes1 });
    this.sosDataList.push({ x: 'Time', y: this.Time1 });
 
  }


  getBySOS() {
    this.chartOptions3 = {
      series: [
        {
          name: 'Brand',
          colors: ['#FFC38F'],
          data: this.sosDataList,
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
        max: 100,
        tickAmount: 5,
      }
    };
  }
}
