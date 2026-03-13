import { Component, input, signal, effect, inject } from '@angular/core';
import { SaleEvolutionService } from '../../services/sale-evolution.service';
import { SETypePosTableModel, SEPriceTableModel } from '../../models/dashboard.models';
import {
  ApexAxisChartSeries, ApexChart,
  ApexDataLabels, ApexXAxis, ApexPlotOptions, ApexYAxis, ApexTooltip, ApexLegend,
} from 'ng-apexcharts';

export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
  yaxis: ApexYAxis | any;
  tooltip: ApexTooltip | any;
  legend: ApexLegend | any;
  colors: any;
}

@Component({
  selector: 'app-se-table-view-area',
  standalone: false,
  templateUrl: './se-table-view-area.component.html',
  styleUrl: './se-table-view-area.component.scss',
})
export class SeTableViewAreaComponent {
  private seService = inject(SaleEvolutionService);

  // Signal inputs
  country_uuid = input('');
  province_uuid = input('');
  area_uuid = input('');
  start_date = input('');
  end_date = input('');

  // State signals
  isLoadingTypePos = signal(false);
  isLoadingPrice = signal(false);
  typePosData = signal<SETypePosTableModel[]>([]);
  priceData = signal<SEPriceTableModel[]>([]);
  activeTab = signal<'typepos' | 'price'>('typepos');

  public chartTypePosOptions: Partial<ChartOptions> | any;
  public chartPriceOptions: Partial<ChartOptions> | any;

  constructor() {
    effect(() => {
      const c = this.country_uuid();
      const p = this.province_uuid();
      const a = this.area_uuid();
      const s = this.start_date();
      const e = this.end_date();
      if (c && p && a && s && e) { this.loadData(); }
    });
  }

  loadData(): void {
    this.loadTypePos();
    this.loadPrice();
  }

  loadTypePos(): void {
    this.isLoadingTypePos.set(true);
    this.seService.TableViewArea(this.country_uuid(), this.province_uuid(), this.area_uuid(), this.start_date(), this.end_date())
      .subscribe({
        next: (res) => {
          this.typePosData.set(res.data || []);
          this.buildTypePosChart();
          this.isLoadingTypePos.set(false);
        },
        error: () => { this.isLoadingTypePos.set(false); }
      });
  }

  loadPrice(): void {
    this.isLoadingPrice.set(true);
    this.seService.TableViewAreaPrice(this.country_uuid(), this.province_uuid(), this.area_uuid(), this.start_date(), this.end_date())
      .subscribe({
        next: (res) => {
          this.priceData.set(res.data || []);
          this.buildPriceChart();
          this.isLoadingPrice.set(false);
        },
        error: () => { this.isLoadingPrice.set(false); }
      });
  }

  buildTypePosChart(): void {
    const data = this.typePosData();
    const categories = data.map(d => d.pos_type);
    this.chartTypePosOptions = {
      series: [
        { name: 'Farde', data: data.map(d => d.total_farde) },
        { name: 'Sold', data: data.map(d => d.total_sold) },
      ],
      chart: { type: 'bar', height: 260, toolbar: { show: false } },
      colors: ['#4361ee', '#f72585'],
      plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: { categories, labels: { rotate: -30 } },
      yaxis: { title: { text: 'Quantité' } },
      legend: { position: 'top' },
      tooltip: { shared: true, intersect: false },
    };
  }

  buildPriceChart(): void {
    const data = this.priceData();
    const categories = data.map(d => d.brand_name);
    this.chartPriceOptions = {
      series: [
        { name: 'Prix moyen (FC)', data: data.map(d => d.avg_price) },
        { name: 'Prix min',        data: data.map(d => d.min_price) },
        { name: 'Prix max',        data: data.map(d => d.max_price) },
      ],
      chart: { type: 'bar', height: 260, toolbar: { show: false } },
      colors: ['#06d6a0', '#4cc9f0', '#f72585'],
      plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: { categories },
      legend: { position: 'top' },
      tooltip: { shared: true, intersect: false },
    };
  }
}
