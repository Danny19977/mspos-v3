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
export class SosChartBarComponent {
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

 
}
