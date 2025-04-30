import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { NDByAreaModel, NDPerformanceModel, TableViewModel } from '../../models/nd-dashboard.models';

export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}

@Component({
  selector: 'app-oos-performance-area',
  standalone: false,
  templateUrl: './oos-performance-area.component.html',
  styleUrl: './oos-performance-area.component.scss'
})
export class OosPerformanceAreaComponent implements OnChanges {
  @Input() performanceAreaList: TableViewModel[] = [];
  @Input() isLoading!: boolean;

  tableArea: NDByAreaModel[] = [];
  areaList: string[] = [];

  performanceArea: NDPerformanceModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions2: Partial<ChartOptions> | any;

  ngOnChanges(changes: SimpleChanges): void {
    this.performanceArea = [];
    // this.areaList = this.performanceAreaList.map((v) => v.Area);

    // for (let index = 0; index < this.performanceAreaList.length; index++) {
    //   const element = this.performanceAreaList[index];
    //   this.areaList.forEach(area => {
    //     if (element.Area == area) {
    //       this.performanceArea.push({ area: element.Area, data: element.Eq });
    //     }
    //   }); 
    // }
    this.getPerformanceEQArea(); 
  }

  getPerformanceEQArea() {
    if (this.performanceArea) {
      this.chartOptions2 = {
        series: [
          {
            data: this.performanceArea.map((val) => 100 - val.data),
            color: '#FF4560',
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
          categories: this.performanceArea.map((val) => val.area),
        },
      };
    }

  }

}
