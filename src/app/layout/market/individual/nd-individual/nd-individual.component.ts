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

  // ── Material table ───────────────────────────────────────────────────────────
  displayedColumns: string[] = [
    'visit_date',
    'pos_name',
    'shop',
    'commune',
    'brand_name',
    'counter',
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

    this.ndService
      .getSummary(uid, s, e)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.summary.set(res.data),
      });

    this.ndService
      .getByBrand(uid, s, e)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.brandList.set(res.data ?? []);
          this.buildBarChart(res.data ?? []);
          this.buildDonutChart(res.data ?? []);
        },
      });

    this.ndService
      .getPosList(uid, s, e)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.posList.set(res.data ?? []);
          this.dataSource.data = res.data ?? [];
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  // ── Chart builders ────────────────────────────────────────────────────────────
  private buildBarChart(brands: NdByBrand[]): void {
    const top = brands.slice(0, 15);
    this.barChartOptions.set({
      series: [
        { name: 'ND%', data: top.map((b) => +(b.nd_percent ?? 0)) },
        { name: 'POS ND actif', data: top.map((b) => b.nd_pos) },
      ],
      chart: { type: 'bar', height: 340, toolbar: { show: false }, fontFamily: 'inherit' },
      plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: top.map((b) => b.brand_name), labels: { rotate: -35, style: { fontSize: '11px' } } },
      yaxis: { title: { text: 'Valeur' } },
      fill: { opacity: 1 },
      tooltip: {
        y: {
          formatter: (val: number, opts: any) => {
            if (opts?.seriesIndex === 0) return val + ' %';
            return val + ' POS';
          },
        },
      },
      legend: { position: 'top' },
      colors: ['#3E7BFA', '#22C55E'],
    });
  }

  private buildDonutChart(brands: NdByBrand[]): void {
    const top = brands.slice(0, 8);
    this.donutChartOptions.set({
      series: top.map((b) => b.nd_pos),
      chart: { type: 'donut', height: 300, fontFamily: 'inherit' },
      labels: top.map((b) => b.brand_name),
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1) + '%' },
      tooltip: { y: { formatter: (val: number) => val + ' POS ND actif' } },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }],
      colors: ['#3E7BFA', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'POS ND',
                formatter: () => String(top.reduce((s, b) => s + b.nd_pos, 0)),
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
}
