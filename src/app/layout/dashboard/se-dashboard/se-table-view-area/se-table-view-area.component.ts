import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../province/models/province.model';
import { SETableViewModel, SETableViewPriceModel } from '../../models/dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { SaleEvolutionService } from '../../services/sale-evolution.service';
import { ProvinceService } from '../../../province/province.service';
import { formatDate } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
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

@Component({
  selector: 'app-se-table-view-area',
  standalone: false,
  templateUrl: './se-table-view-area.component.html',
  styleUrl: './se-table-view-area.component.scss'
})
export class SeTableViewAreaComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  province!: IProvince

  tableViewList: SETableViewModel[] = [];
  tableViewPriceList: SETableViewPriceModel[] = [];

  public chartOptions3: Partial<ChartOptions> | any;
  public chartOptions4: Partial<ChartOptions> | any;

  constructor(
    private route: ActivatedRoute,
    private _formBuilder: FormBuilder,
    private saleEvolutionService: SaleEvolutionService,
    private provinceService: ProvinceService,
  ) { }


  ngOnInit(): void {
    this.isLoading = true;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      rangeValue: new FormControl(this.rangeDate),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');

    this.route.params.subscribe(params => {
      const provinceName = params['province_name'];
      console.log('Province Name:', provinceName);
      this.provinceService.getBy(provinceName).subscribe((res) => {
        this.province = res.data;
        console.log('Province:', this.province);
        this.getTableArea(this.province.country_uuid, this.province.uuid);
        this.getTableAreaPrice(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
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

      this.getTableArea(this.province.country_uuid, this.province.uuid);
      this.getTableAreaPrice(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);

    });
  }


  getTableArea(country_uuid: string, province_uuid: string) {
    this.saleEvolutionService.TableViewArea(country_uuid, province_uuid).subscribe((res) => {
      this.tableViewList = res.data;
      this.getPieChartData();
      this.isLoading = false;
    });
  }

  getTableAreaPrice(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.saleEvolutionService.TableViewAreaPrice(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewPriceList = res.data;
      this.getPieChartDataPrix();
      this.isLoading = false;
    });
  }


  getPieChartData() { 
    const series = (this.tableViewList || []).map((item) => item.total_pos);
    const labels = (this.tableViewList || []).map((item) => item.type_pos);

    console.log('series:', series);
    console.log('labels:', labels);

    this.chartOptions3 = {
      series: series,
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
      labels: labels,
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

  getPieChartDataPrix() {
    const series = (this.tableViewPriceList || []).map((item) => item.count_price);
    const labels = (this.tableViewPriceList || []).map((item) => item.price);

    this.chartOptions4 = {
      series: series,
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
      labels: labels,
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
