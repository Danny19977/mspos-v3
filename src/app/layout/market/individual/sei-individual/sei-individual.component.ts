import {
  Component,
  OnChanges,
  SimpleChanges,
  Input,
  signal,
  inject,
  DestroyRef,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { IUser } from '../../../management/user/models/user.model';
import {
  SeiIndividualService,
  SeiSummaryKPI,
  SeiPosType,
  SeiPriceBrand,
  SeiMonthly,
  SeiGrowth,
  SeiBrandComp,
  SeiTopPos,
  SeiHeatmap,
  SeiPriceSlice,
} from './sei-individual.service';
import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
  ApexLegend,
  ApexStroke,
  ApexFill,
  ApexResponsive,
  ApexGrid,
} from 'ng-apexcharts';
import { MatTableDataSource } from '@angular/material/table';

// ── Chart option types ─────────────────────────────────────────────────────────
export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  colors: string[];
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  stroke: ApexStroke;
  fill: ApexFill;
  colors: string[];
};

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  responsive: ApexResponsive[];
  colors: string[];
  plotOptions: ApexPlotOptions;
};

export type SeiTab = 'overview' | 'brands' | 'evolution' | 'activity';

@Component({
  selector: 'app-sei-individual',
  standalone: false,
  templateUrl: './sei-individual.component.html',
  styleUrl: './sei-individual.component.scss',
})
export class SeiIndividualComponent implements OnChanges {
  // ── Injections ─────────────────────────────────────────────────────────────
  private readonly seiService = inject(SeiIndividualService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Inputs ─────────────────────────────────────────────────────────────────
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() currentUser: IUser | null = null;

  // ── UI State ───────────────────────────────────────────────────────────────
  isLoading = signal(false);
  activeTab = signal<SeiTab>('overview');

  // ── Data signals ───────────────────────────────────────────────────────────
  summary      = signal<SeiSummaryKPI | null>(null);
  posTypes     = signal<SeiPosType[]>([]);
  priceBrands  = signal<SeiPriceBrand[]>([]);
  monthly      = signal<SeiMonthly[]>([]);
  growth       = signal<SeiGrowth[]>([]);
  brandComp    = signal<SeiBrandComp[]>([]);
  topPos       = signal<SeiTopPos[]>([]);
  heatmap      = signal<SeiHeatmap[]>([]);
  priceSlices  = signal<SeiPriceSlice[]>([]);

  // ── Chart options ──────────────────────────────────────────────────────────
  lineChartOptions    = signal<Partial<LineChartOptions>>({});
  barBrandOptions     = signal<Partial<BarChartOptions>>({});
  donutPriceOptions   = signal<Partial<DonutChartOptions>>({});
  barPosTypeOptions   = signal<Partial<BarChartOptions>>({});

  // ── Material tables ────────────────────────────────────────────────────────
  topPosDataSource = new MatTableDataSource<SeiTopPos>([]);
  displayedTopPos: string[] = [
    'rank', 'pos_name', 'shop', 'postype', 'commune_name',
    'total_visits', 'total_farde', 'total_sold', 'avg_price', 'farde_share',
  ];

  growthDataSource = new MatTableDataSource<SeiGrowth>([]);
  displayedGrowth: string[] = [
    'brand_name', 'curr_farde', 'prev_farde', 'delta_farde',
    'growth_farde_pct', 'curr_visits', 'trend',
  ];

  brandDataSource = new MatTableDataSource<SeiPriceBrand>([]);
  displayedBrand: string[] = [
    'brand_name', 'total_visits', 'avg_price', 'min_price', 'max_price',
    'total_farde', 'total_sold', 'revenue_share',
  ];

  // ── Brand colour palette ───────────────────────────────────────────────────
  readonly BRAND_COLORS = [
    '#4361ee', '#f72585', '#06d6a0', '#ffd166', '#ef476f',
    '#118ab2', '#7209b7', '#3a0ca3', '#4cc9f0', '#ff9f1c',
    '#e63946', '#2a9d8f', '#e9c46a', '#f4a261', '#264653',
  ];

  // ── Computed ───────────────────────────────────────────────────────────────
  topBrand = computed(() => this.brandComp()[0] ?? null);

  heatmapByDay = computed(() => {
    const map = new Map<number, { day_name: string; total_farde: number; total_visits: number }>();
    for (const row of this.heatmap()) {
      const existing = map.get(row.day_of_week);
      if (existing) {
        existing.total_farde += row.total_farde;
        existing.total_visits += row.total_visits;
      } else {
        map.set(row.day_of_week, {
          day_name: row.day_name.trim(),
          total_farde: row.total_farde,
          total_visits: row.total_visits,
        });
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);
  });

  bestDay = computed(() => {
    const days = this.heatmapByDay();
    return days.reduce(
      (best, d) => (d.total_farde > best.total_farde ? d : best),
      days[0] ?? { day_name: '—', total_farde: 0, total_visits: 0 }
    );
  });

  maxHeatmapFarde = computed(() =>
    Math.max(1, ...this.heatmapByDay().map(d => d.total_farde))
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['startDate'] || changes['endDate'] || changes['currentUser']) &&
      this.startDate && this.endDate && this.currentUser?.uuid
    ) {
      this.loadAll();
    }
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  loadAll(): void {
    const uid = this.currentUser?.uuid;
    if (!uid) return;
    this.isLoading.set(true);

    const s = this.startDate;
    const e = this.endDate;
    const { prevStart, prevEnd } = this.computePrevPeriod(s, e);

    forkJoin({
      summary:     this.seiService.getSummaryKPI(uid, s, e),
      posTypes:    this.seiService.getByPosType(uid, s, e),
      priceBrands: this.seiService.getPriceByBrand(uid, s, e),
      monthly:     this.seiService.getEvolutionByMonth(uid, s, e),
      growth:      this.seiService.getGrowthRate(uid, s, e, prevStart, prevEnd),
      brandComp:   this.seiService.getBrandCompetition(uid, s, e),
      topPos:      this.seiService.getTopPos(uid, s, e),
      heatmap:     this.seiService.getHeatmap(uid, s, e),
      priceSlices: this.seiService.getPricePieChart(uid, s, e),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ summary, posTypes, priceBrands, monthly, growth, brandComp, topPos, heatmap, priceSlices }) => {
          this.summary.set(summary.data);

          const ptData = posTypes.data ?? [];
          this.posTypes.set(ptData);
          this.buildBarPosType(ptData);

          const pbData = priceBrands.data ?? [];
          this.priceBrands.set(pbData);
          this.brandDataSource.data = pbData;
          this.buildBarBrand(pbData);

          const mData = monthly.data ?? [];
          this.monthly.set(mData);
          this.buildLineChart(mData);

          const gData = growth.data ?? [];
          this.growth.set(gData);
          this.growthDataSource.data = gData;

          const bcData = brandComp.data ?? [];
          this.brandComp.set(bcData);

          const tpData = topPos.data ?? [];
          this.topPos.set(tpData);
          this.topPosDataSource.data = tpData;

          this.heatmap.set(heatmap.data ?? []);

          const slices = priceSlices.data ?? [];
          this.priceSlices.set(slices);
          this.buildDonutPrice(slices);

          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Split current period into prev period of same length */
  private computePrevPeriod(start: string, end: string): { prevStart: string; prevEnd: string } {
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = e.getTime() - s.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / 86_400_000));
    const prevEnd = new Date(s.getTime() - 86_400_000);
    const prevStart = new Date(prevEnd.getTime() - diffDays * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { prevStart: fmt(prevStart), prevEnd: fmt(prevEnd) };
  }

  trendIcon(trend: 'UP' | 'DOWN' | 'STABLE'): string {
    if (trend === 'UP')     return 'ti ti-trending-up text-success';
    if (trend === 'DOWN')   return 'ti ti-trending-down text-danger';
    return 'ti ti-minus text-secondary';
  }

  trendBadge(trend: 'UP' | 'DOWN' | 'STABLE'): string {
    if (trend === 'UP')   return 'badge bg-success-subtle text-success';
    if (trend === 'DOWN') return 'badge bg-danger-subtle text-danger';
    return 'badge bg-secondary-subtle text-secondary';
  }

  growthColor(pct: number): string {
    if (pct > 0) return '#28a745';
    if (pct < 0) return '#dc3545';
    return '#6c757d';
  }

  // ── Chart builders ─────────────────────────────────────────────────────────

  private buildLineChart(data: SeiMonthly[]): void {
    const brands = [...new Set(data.map(r => r.brand_name))];
    const months = [...new Set(data.map(r => r.year_month))].sort();

    const series: ApexAxisChartSeries = brands.map(brand => ({
      name: brand,
      data: months.map(m => {
        const row = data.find(r => r.brand_name === brand && r.year_month === m);
        return row?.total_farde ?? 0;
      }),
    }));

    this.lineChartOptions.set({
      series,
      chart: { type: 'line', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      stroke: { curve: 'smooth', width: 2 },
      colors: this.BRAND_COLORS,
      xaxis: { categories: months, labels: { style: { fontSize: '11px' } } },
      yaxis: { labels: { formatter: (v: number) => v.toFixed(0) } },
      tooltip: { y: { formatter: (v: number) => `${v.toFixed(2)} fardes` } },
      legend: { position: 'bottom' },
      dataLabels: { enabled: false },
      grid: { strokeDashArray: 3 },
    });
  }

  private buildBarBrand(data: SeiPriceBrand[]): void {
    const top = data.slice(0, 12);
    this.barBrandOptions.set({
      series: [
        { name: 'Fardes', data: top.map(r => r.total_farde) },
        { name: 'Vendus', data: top.map(r => r.total_sold) },
      ],
      chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
      xaxis: { categories: top.map(r => r.brand_name) },
      colors: ['#4361ee', '#f72585'],
      dataLabels: { enabled: false },
      legend: { position: 'top' },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      fill: { opacity: 1 },
      tooltip: { y: { formatter: (v: number) => v.toFixed(2) } },
      yaxis: { labels: { style: { fontSize: '11px' } } },
    });
  }

  private buildDonutPrice(data: SeiPriceSlice[]): void {
    this.donutPriceOptions.set({
      series: data.map(r => r.count),
      labels: data.map(r => `${r.price.toLocaleString()} FC`),
      chart: { type: 'donut', height: 300, fontFamily: 'inherit' },
      colors: this.BRAND_COLORS,
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: {
        enabled: true,
        formatter: (_: unknown, opts: { seriesIndex: number }) =>
          `${data[opts.seriesIndex]?.share_pct ?? 0}%`,
      },
      tooltip: { y: { formatter: (v: number) => `${v} visites` } },
      responsive: [{ breakpoint: 480, options: { chart: { width: 260 } } }],
      plotOptions: { pie: { donut: { size: '65%' } } },
    });
  }

  private buildBarPosType(data: SeiPosType[]): void {
    this.barPosTypeOptions.set({
      series: [
        { name: 'Fardes',  data: data.map(r => r.total_farde) },
        { name: 'Vendus',  data: data.map(r => r.total_sold) },
      ],
      chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'inherit' },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
      xaxis: { categories: data.map(r => r.pos_type), labels: { style: { fontSize: '11px' } } },
      colors: ['#06d6a0', '#ffd166'],
      dataLabels: { enabled: false },
      legend: { position: 'top' },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      fill: { opacity: 1 },
      tooltip: { y: { formatter: (v: number) => v.toFixed(2) } },
      yaxis: { labels: { formatter: (v: number) => v.toFixed(0) } },
    });
  }
}
