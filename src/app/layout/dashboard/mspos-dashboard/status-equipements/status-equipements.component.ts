import { Component, ViewChild, OnChanges, SimpleChanges, Input } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts'; 
import { StatusEquipementModel } from '../../models/summary-dashboard.model';
export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}

@Component({
  selector: 'app-status-equipements',
  standalone: false,
  templateUrl: './status-equipements.component.html',
  styleUrl: './status-equipements.component.scss'
})
export class StatusEquipementsComponent implements OnChanges {
  @Input() isLoading!: boolean;
  @Input() statusEquipementList: StatusEquipementModel[] = [];
 

  // statusEquipDataList: StatusEquipementModel[] = [];

  @ViewChild('chart') chart!: ChartComponent; 
  public chartOptions3: Partial<ChartOptions> | any;


  ngOnChanges(changes: SimpleChanges): void {
    // this.statusEquipDataList = this.statusEquipementList; 
    this.getPieChart();
  }

  getPieChart() {
    this.chartOptions3 = {
      series: this.statusEquipementList.map((val) => val.Count),
      chart: {
        width: 400,
        type: 'donut',
      },
      legend: {
        position: 'bottom',
        formatter: function (val: any, opts: any) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex];
        },
      },
      colors: this.statusEquipementList.map((val) => {
        if (val.Equipement == 'Casser') {
          return '#FFA500';
        } else if (val.Equipement == 'Vieux') {
          return '#7B3F00'
        } else if (val.Equipement == 'Bien') {
          return '#00E396'
        } else {
          return ''
        }
      }),  // ['#4A00E5', '#FFA201', '#0092E4', '#E41F07'],
      labels: this.statusEquipementList.map((val) => val.Equipement), // ['Campaigns', 'Google', 'Referrals', 'Paid Social'],
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 270,
        },
      },
      dataLabels: {
        enabled: false,
      },

      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    };
  }

}
