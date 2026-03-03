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
import { IUser } from '../../../management/user/models/user.model';
import {
  SosIndividualService,
  SosSummary,
  SosByBrand,
  SosPosItem,
} from './sos-individual.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
  ApexLegend,
  ApexStroke,
  ApexFill,
  ApexNonAxisChartSeries,
  ApexResponsive,
} from 'ng-apexcharts';

// ── Chart option types ────────────────────────────────────────────────────────
export type SosBarChartOptions = {
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

export type SosDonutChartOptions = {
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

@Component({
  selector: 'app-sos-individual',
  standalone: false,
  templateUrl: './sos-individual.component.html',
  styleUrl: './sos-individual.component.scss',
})
export class SosIndividualComponent implements OnChanges {
  // ── Injections ───────────────────────────────────────────────────────────────
  private readonly sosService = inject(SosIndividualService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Inputs from parent ───────────────────────────────────────────────────────
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() currentUser: IUser | null = null;

  // ── State ────────────────────────────────────────────────────────────────────
  isLoading = signal(false);

  summary = signal<SosSummary | null>(null);
  brandList = signal<SosByBrand[]>([]);
  posList = signal<SosPosItem[]>([]);

  // ── Filter / Search ───────────────────────────────────────────────────────────
  searchPos = signal('');
  filterBrand = signal('');

  // ── Inner tabs ───────────────────────────────────────────────────────────────
  activeTab = signal<'overview' | 'brands' | 'pos'>('overview');

  // ── Chart options ────────────────────────────────────────────────────────────
  barChartOptions = signal<Partial<SosBarChartOptions>>({});
  donutChartOptions = signal<Partial<SosDonutChartOptions>>({});

  // ── Computed helpers ─────────────────────────────────────────────────────────
  sosColor = computed(() => {
    const pct = this.summary()?.dominant_brand_sos ?? 0;
    if (pct >= 40) return '#28a745';
    if (pct >= 20) return '#ffc107';
    return '#dc3545';
  });

  reachColor = computed(() => {
    const pct = this.summary()?.reach_rate ?? 0;
    if (pct >= 80) return '#28a745';
    if (pct >= 50) return '#ffc107';
    return '#dc3545';
  });

  filteredPosList = computed(() => {
    let list = this.posList();
    const q = this.searchPos().toLowerCase();
    const brand = this.filterBrand().toLowerCase();

    if (q) {
      list = list.filter(
        (r) =>
          r.pos_name.toLowerCase().includes(q) ||
          r.shop.toLowerCase().includes(q) ||
          r.commune.toLowerCase().includes(q)
      );
    }
    if (brand) {
      list = list.filter((r) => r.brand_name.toLowerCase().includes(brand));
    }
    return list;
  });

  uniqueBrandsInPos = computed(() => {
    const brands = new Set(this.posList().map((r) => r.brand_name));
    return Array.from(brands).sort();
  });

  dominantBrand = computed(() => {
    const list = [...this.brandList()];
    list.sort((a, b) => b.sos_percent - a.sos_percent);
    return list[0] ?? null;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['startDate'] || changes['endDate'] || changes['currentUser']) &&
        this.startDate && this.endDate && this.currentUser?.uuid) {
      this.loadAll();
    }
  }

  // ── Data loading ──────────────────────────────────────────────────────────────
  loadAll(): void {
    const user = this.currentUser;
    if (!user?.uuid) return;
    this.isLoading.set(true);

    const uid = user.uuid;
    const s = this.startDate;
    const e = this.endDate;

    this.sosService
      .getSummary(uid, s, e)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.summary.set(res.data),
      });

    this.sosService
      .getByBrand(uid, s, e)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const data = (res.data ?? []).filter((b) => b.brand_fardes > 0);
          this.brandList.set(data);
          this.buildBarChart(data);
          this.buildDonutChart(data);
        },
      });

    this.sosService
      .getPosList(uid, s, e)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.posList.set(res.data ?? []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  // ── Chart builders ────────────────────────────────────────────────────────────
  private buildBarChart(brands: SosByBrand[]): void {
    const top = brands.slice(0, 15);
    this.barChartOptions.set({
      series: [
        { name: 'SOS%', data: top.map((b) => +(b.sos_percent ?? 0)) },
        { name: 'Fardes', data: top.map((b) => b.brand_fardes) },
      ],
      chart: { type: 'bar', height: 340, toolbar: { show: false }, fontFamily: 'inherit' },
      plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: {
        categories: top.map((b) => b.brand_name),
        labels: { rotate: -35, style: { fontSize: '11px' } },
      },
      yaxis: { title: { text: 'Valeur' } },
      fill: { opacity: 1 },
      tooltip: {
        y: {
          formatter: (val: number, opts: any) => {
            if (opts?.seriesIndex === 0) return val + ' %';
            return val + ' fardes';
          },
        },
      },
      legend: { position: 'top' },
      colors: ['#F59E0B', '#8B5CF6'],
    });
  }

  private buildDonutChart(brands: SosByBrand[]): void {
    const top = brands.slice(0, 8);
    this.donutChartOptions.set({
      series: top.map((b) => b.brand_fardes),
      chart: { type: 'donut', height: 300, fontFamily: 'inherit' },
      labels: top.map((b) => b.brand_name),
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1) + '%' },
      tooltip: { y: { formatter: (val: number) => val + ' fardes' } },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }],
      colors: ['#F59E0B', '#8B5CF6', '#3E7BFA', '#22C55E', '#EF4444', '#EC4899', '#14B8A6', '#F97316'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total fardes',
                formatter: () => String(top.reduce((s, b) => s + b.brand_fardes, 0)),
              },
            },
          },
        },
      },
    });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────────
  getSosStatusClass(pct: number): string {
    if (pct >= 40) return 'bg-success-light text-success';
    if (pct >= 20) return 'bg-warning-light text-warning';
    return 'bg-danger-light text-danger';
  }

  getSosStatusLabel(pct: number): string {
    if (pct >= 40) return 'Dominant';
    if (pct >= 20) return 'Moyen';
    return 'Faible';
  }
}
