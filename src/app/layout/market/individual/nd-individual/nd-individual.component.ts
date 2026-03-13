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
  NdIndividualService,
  NdSummary,
  NdByBrand,
  NdPosItem,
} from './nd-individual.service';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexXAxis, ApexYAxis, ApexTooltip, ApexLegend, ApexStroke, ApexFill, ApexNonAxisChartSeries, ApexResponsive } from 'ng-apexcharts';
import { MatTableDataSource } from '@angular/material/table';

// ── Chart option types ────────────────────────────────────────────────────────
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

@Component({
  selector: 'app-nd-individual',
  standalone: false,
  templateUrl: './nd-individual.component.html',
  styleUrl: './nd-individual.component.scss',
})
export class NdIndividualComponent implements OnChanges {
  // ── Injections ───────────────────────────────────────────────────────────────
  private readonly ndService = inject(NdIndividualService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Inputs from parent ───────────────────────────────────────────────────────
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() currentUser: IUser | null = null;

  // ── State ────────────────────────────────────────────────────────────────────
  isLoading = signal(false);

  summary = signal<NdSummary | null>(null);
  brandList = signal<NdByBrand[]>([]);
  posList = signal<NdPosItem[]>([]);

  // ── Filter / Search for POS table ────────────────────────────────────────────
  searchPos = signal('');
  filterBrand = signal('');
  filterNdOnly = signal(false);

  // ── Active tab ───────────────────────────────────────────────────────────────
  activeTab = signal<'overview' | 'brands' | 'pos'>('overview');

  // ── Brand colour palette (shared with nd-dashboard) ──────────────────────────
  readonly BRAND_COLORS = [
    '#4361ee','#f72585','#06d6a0','#ffd166','#ef476f',
    '#118ab2','#7209b7','#3a0ca3','#4cc9f0','#ff9f1c',
    '#e63946','#2a9d8f','#e9c46a','#f4a261','#264653',
  ];

  // ── Material table ───────────────────────────────────────────────────────────
  displayedColumns: string[] = [
    'visit_date',
    'pos_name',
    'shop',
    'commune',
    'brand_name',
    'number_farde',
    'nd_active',
  ];
  dataSource = new MatTableDataSource<NdPosItem>([]);

  // ── Chart options ────────────────────────────────────────────────────────────
  barChartOptions = signal<Partial<BarChartOptions>>({});
  donutChartOptions = signal<Partial<DonutChartOptions>>({});

  // ── Computed helpers ─────────────────────────────────────────────────────────
  ndColor = computed(() => {
    const pct = this.summary()?.nd_percent ?? 0;
    if (pct >= 75) return '#28a745';
    if (pct >= 50) return '#ffc107';
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
    if (this.filterNdOnly()) {
      list = list.filter((r) => r.nd_active);
    }
    return list;
  });

  uniqueBrandsInPos = computed(() => {
    const brands = new Set(this.posList().map((r) => r.brand_name));
    return Array.from(brands).sort();
  });

  ndPositivePosCount = computed(
    () => new Set(this.posList().filter((r) => r.nd_active).map((r) => r.pos_uuid)).size
  );

  topBrand = computed(() => {
    const list = [...this.brandList()];
    list.sort((a, b) => b.nd_percent - a.nd_percent);
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

    forkJoin({
      summary: this.ndService.getSummary(uid, s, e),
      brands:  this.ndService.getByBrand(uid, s, e),
      pos:     this.ndService.getPosList(uid, s, e),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ summary, brands, pos }) => {
          this.summary.set(summary.data);

          const brandData = brands.data ?? [];
          this.brandList.set(brandData);
          this.buildBarChart(brandData);
          this.buildDonutChart(brandData);

          const posData = pos.data ?? [];
          this.posList.set(posData);
          this.dataSource.data = posData;

          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  // ── Chart builders ────────────────────────────────────────────────────────────
  private buildBarChart(brands: NdByBrand[]): void {
    const top = brands.slice(0, 15);
    if (!top.length) { this.barChartOptions.set({}); return; }
    this.barChartOptions.set({
      series: [
        { name: 'ND %',       data: top.map((b) => +(b.nd_percent ?? 0)) },
        { name: 'POS ND actif', data: top.map((b) => b.nd_brand) },
      ],
      chart: { type: 'bar', height: 340, toolbar: { show: false } },
      colors: [this.BRAND_COLORS[0], this.BRAND_COLORS[2]],
      plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 3 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: top.map((b) => b.brand_name), labels: { rotate: -35, style: { fontSize: '11px' } } },
      yaxis: { title: { text: 'Valeur' } },
      fill: { opacity: 1 },
      tooltip: {
        y: {
          formatter: (val: number, opts: any) =>
            opts?.seriesIndex === 0 ? `${val.toFixed(1)} %` : `${val} POS`,
        },
      },
      legend: { position: 'top' },
    });
  }

  private buildDonutChart(brands: NdByBrand[]): void {
    const top = brands.slice(0, 8);
    if (!top.length) { this.donutChartOptions.set({}); return; }
    this.donutChartOptions.set({
      series: top.map((b) => b.nd_brand),
      chart: { type: 'donut', height: 300 },
      labels: top.map((b) => b.brand_name),
      colors: this.BRAND_COLORS.slice(0, top.length),
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(1)}%` },
      tooltip: { y: { formatter: (val: number) => `${val} POS ND actif` } },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'POS ND',
                formatter: () => String(top.reduce((s, b) => s + b.nd_brand, 0)),
              },
            },
          },
        },
      },
    });
  }

  // ── Table helpers ─────────────────────────────────────────────────────────────
  applySearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchPos.set(val);
    this.dataSource.filter = val.trim().toLowerCase();
  }

  getNdBadgeClass(active: boolean): string {
    return active ? 'badge bg-success-light text-success' : 'badge bg-danger-light text-danger';
  }

  getGaugeStrokeDashArray(percent: number, circumference = 220): string {
    const offset = circumference - (percent / 100) * circumference;
    return `${circumference - offset} ${offset}`;
  }

  // ── Helpers (alignés avec nd-dashboard) ──────────────────────────────────────
  getNdBadge(nd: number): string {
    if (nd >= 75) return 'badge bg-success';
    if (nd >= 40) return 'badge bg-warning text-dark';
    return 'badge bg-danger';
  }

  getTrendClass(value: number): string {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }

  getTrendIcon(trend: string): string {
    if (trend === 'up')   return 'ti ti-trending-up text-success';
    if (trend === 'down') return 'ti ti-trending-down text-danger';
    return 'ti ti-minus text-warning';
  }

  getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}
