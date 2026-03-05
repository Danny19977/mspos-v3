import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnInit,
  Renderer2,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { ChartComponent } from 'ng-apexcharts';

import { routes } from '../../../shared/routes/routes';
import { CommonService } from '../../../shared/common/common.service';
import { AuthService } from '../../../auth/auth.service';
import { SishService } from '../services/sish.service';
import { CountryService } from '../../territories/country/country.service';
import { ProvinceService } from '../../territories/province/province.service';
import { AreaService } from '../../territories/areas/area.service';
import { SubareaService } from '../../territories/subarea/subarea.service';
import { CommuneService } from '../../territories/commune/commune.service';

import { IUser } from '../../management/user/models/user.model';
import { ICountry } from '../../territories/country/models/country.model';
import { IProvince } from '../../territories/province/models/province.model';
import { IArea } from '../../territories/areas/models/area.model';
import { ISubArea } from '../../territories/subarea/models/subarea.model';
import { ICommune } from '../../territories/commune/models/commune.model';

import {
  SISHTableRowModel,
  SISHBarGroupModel,
  SISHBarRawRowModel,
  SISHTrendSeriesModel,
  SISHTrendRowModel,
  SISHSummaryKPIModel,
  SISHBrandRankModel,
  SISHVelocityRowModel,
  SISHEvolutionRowModel,
  SISHHeatmapModel,
  SISHGapRowModel,
  SISHVsSosRowModel,
  SISHPosDrillRowModel,
} from '../models/dashboard.models';

export type SISHSection =
  | 'kpi' | 'trend' | 'tableview' | 'barchart'
  | 'ranking' | 'velocity' | 'gap' | 'evolution'
  | 'heatmap' | 'correlation' | 'drilldown';

export type GeoLevel = 'province' | 'area' | 'subarea' | 'commune';

@Component({
  selector: 'app-sish-dashboard',
  standalone: false,
  templateUrl: './sish-dashboard.component.html',
  styleUrl: './sish-dashboard.component.scss',
})
export class SishDashboardComponent implements OnInit {

  // ── DI ────────────────────────────────────────────────────────────────────
  private common          = inject(CommonService);
  private renderer        = inject(Renderer2);
  private fb              = inject(FormBuilder);
  private cdr             = inject(ChangeDetectorRef);
  private authService     = inject(AuthService);
  private sishService     = inject(SishService);
  private countryService  = inject(CountryService);
  private provinceService = inject(ProvinceService);
  private areaService     = inject(AreaService);
  private subAreaService  = inject(SubareaService);
  private communeService  = inject(CommuneService);

  public routes = routes;
  base = ''; page = ''; last = '';

  currentUser!: IUser;

  // ── Date range ─────────────────────────────────────────────────────────────
  dateRange!: FormGroup;
  start_date = '';
  end_date   = '';
  selectedPeriod = signal<string>('1m');

  readonly PERIODS = [
    { key: 'today',  label: "Aujourd'hui" },
    { key: '1w',     label: '1 semaine'   },
    { key: '1m',     label: '1 mois'      },
    { key: '3m',     label: '3 mois'      },
    { key: '6m',     label: '6 mois'      },
    { key: '1y',     label: '1 an'        },
    { key: 'custom', label: 'Personnalisé' },
  ];

  // ── Geography ─────────────────────────────────────────────────────────────
  countryList  = signal<ICountry[]>([]);
  provinceList = signal<IProvince[]>([]);
  areaList     = signal<IArea[]>([]);
  subAreaList  = signal<ISubArea[]>([]);
  communeList  = signal<ICommune[]>([]);

  selectedCountry?:  ICountry;
  selectedProvince?: IProvince;
  selectedArea?:     IArea;
  selectedSubArea?:  ISubArea;
  selectedCommune?:  ICommune;

  // ── Active section / geo level ─────────────────────────────────────────────
  activeSection = signal<SISHSection>('kpi');
  geoLevel      = signal<GeoLevel>('province');
  heatmapLevel  = signal<GeoLevel>('province');

  // ── Drill-down state ───────────────────────────────────────────────────────
  drillBrand = signal<{ uuid: string; name: string } | null>(null);

  // ── Loading flags ──────────────────────────────────────────────────────────
  isLoadingKpi         = signal(false);
  isLoadingTrend       = signal(false);
  isLoadingTable       = signal(false);
  isLoadingBar         = signal(false);
  isLoadingRanking     = signal(false);
  isLoadingVelocity    = signal(false);
  isLoadingGap         = signal(false);
  isLoadingEvolution   = signal(false);
  isLoadingHeatmap     = signal(false);
  isLoadingCorrelation = signal(false);
  isLoadingDrilldown   = signal(false);

  // ── Data signals ───────────────────────────────────────────────────────────
  kpiData         = signal<SISHSummaryKPIModel | null>(null);
  trendData       = signal<SISHTrendSeriesModel[]>([]);
  tableData       = signal<SISHTableRowModel[]>([]);
  barData         = signal<SISHBarGroupModel[]>([]);
  rankingData     = signal<SISHBrandRankModel[]>([]);
  velocityData    = signal<SISHVelocityRowModel[]>([]);
  gapData         = signal<SISHGapRowModel[]>([]);
  evolutionData   = signal<SISHEvolutionRowModel[]>([]);
  heatmapData     = signal<SISHHeatmapModel>({ brands: [], territories: [], matrix: [] });
  correlationData = signal<SISHVsSosRowModel[]>([]);
  drilldownData   = signal<SISHPosDrillRowModel[]>([]);

  // ── Chart options ──────────────────────────────────────────────────────────
  chartTrendOpts       = signal<any>(null);
  chartBarOpts         = signal<any>(null);
  chartGapOpts         = signal<any>(null);
  chartEvolutionOpts   = signal<any>(null);
  chartHeatmapOpts     = signal<any>(null);
  chartRankingOpts     = signal<any>(null);
  chartCorrelationOpts = signal<any>(null);
  chartVelocityOpts    = signal<any>(null);

  // ── Table view grouping ────────────────────────────────────────────────────
  tableGrouped = computed<{ territory_name: string; territory_uuid: string; rows: SISHTableRowModel[] }[]>(() => {
    const map = new Map<string, SISHTableRowModel[]>();
    for (const row of this.tableData()) {
      if (!map.has(row.territory_uuid)) map.set(row.territory_uuid, []);
      map.get(row.territory_uuid)!.push(row);
    }
    return [...map.entries()].map(([uuid, rows]) => ({
      territory_uuid: uuid,
      territory_name: rows[0].territory_name,
      rows,
    }));
  });

  // ── Velocity bucket computed ───────────────────────────────────────────────
  velocityBuckets = computed(() => {
    const counts = { fast_mover: 0, aligned: 0, slow_mover: 0 };
    for (const r of this.velocityData()) {
      if (r.velocity_category in counts) counts[r.velocity_category as keyof typeof counts]++;
    }
    return counts;
  });

  // ── Correlation position counts ────────────────────────────────────────────
  correlationPositionCounts = computed(() => {
    const counts = { fast_leader: 0, sell_through_star: 0, shelf_hoarder: 0, underperformer: 0 };
    for (const r of this.correlationData()) {
      if (r.position in counts) counts[r.position as keyof typeof counts]++;
    }
    return counts;
  });

  // ── Gap status counts ──────────────────────────────────────────────────────
  gapStatusCounts = computed(() => {
    const above = this.gapData().filter(d => d.status === 'above_target').length;
    const below = this.gapData().filter(d => d.status === 'below_target').length;
    return { above, below };
  });

  // ── Chart ViewChilds ───────────────────────────────────────────────────────
  @ViewChild('chartTrend')       chartTrendRef!:       ChartComponent;
  @ViewChild('chartBar')         chartBarRef!:         ChartComponent;
  @ViewChild('chartGap')         chartGapRef!:         ChartComponent;
  @ViewChild('chartEvolution')   chartEvolutionRef!:   ChartComponent;
  @ViewChild('chartHeatmap')     chartHeatmapRef!:     ChartComponent;
  @ViewChild('chartRanking')     chartRankingRef!:     ChartComponent;
  @ViewChild('chartCorrelation') chartCorrelationRef!: ChartComponent;
  @ViewChild('chartVelocity')    chartVelocityRef!:    ChartComponent;

  readonly BRAND_COLORS = [
    '#e11d48','#f97316','#eab308','#10b981','#0ea5e9',
    '#6366f1','#a855f7','#14b8a6','#f43f5e','#8b5cf6',
    '#84cc16','#3b82f6','#ec4899','#06b6d4','#2dd4bf',
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.common.base.subscribe(b => this.base = b);
    this.common.page.subscribe(p => this.page = p);
    this.common.last.subscribe(l => this.last = l);

    const now      = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.start_date = formatDate(firstDay, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(lastDay,  'yyyy-MM-dd', 'en-US');
    this.dateRange  = this.fb.group({ rangeValue: new FormControl([firstDay, lastDay]) });

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.countryService.getAll().subscribe(res => {
          this.countryList.set(res.data);
          const defaultCountry =
            (user.role !== 'Managers' && user.role !== 'Support')
              ? res.data[0]
              : res.data.find((c: ICountry) => c.uuid === user.country_uuid) ?? res.data[0];
          this.selectedCountry = defaultCountry;
          this.provinceService.getAll().subscribe(pr => {
            this.provinceList.set(pr.data);
            const defaultProvince =
              (user.role !== 'Managers' && user.role !== 'Support')
                ? pr.data[0]
                : pr.data.find((p: IProvince) => p.uuid === user.province_uuid) ?? pr.data[0];
            this.selectedProvince = defaultProvince;
            this.loadAllSections();
          });
        });
      },
      error: err => console.error(err),
    });

    this.dateRange.valueChanges.subscribe(val => {
      if (this.selectedPeriod() !== 'custom') return;
      if (val.rangeValue?.[0] && val.rangeValue?.[1]) {
        this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');
        const end = new Date(val.rangeValue[1]);
        end.setDate(end.getDate() + 1);
        this.end_date = formatDate(end, 'yyyy-MM-dd', 'en-US');
        this.loadAllSections();
      }
    });
  }

  // ── Geo param shortcuts ────────────────────────────────────────────────────
  get country_uuid()  { return this.selectedCountry?.uuid  ?? ''; }
  get province_uuid() { return this.selectedProvince?.uuid ?? ''; }
  get area_uuid()     { return this.selectedArea?.uuid     ?? ''; }
  get sub_area_uuid() { return this.selectedSubArea?.uuid  ?? ''; }
  get commune_uuid()  { return this.selectedCommune?.uuid  ?? ''; }

  private get geoParams() {
    return {
      country_uuid:  this.country_uuid,
      province_uuid: this.province_uuid,
      area_uuid:     this.area_uuid,
      sub_area_uuid: this.sub_area_uuid,
      commune_uuid:  this.commune_uuid,
      start_date:    this.start_date,
      end_date:      this.end_date,
    };
  }

  // ── Section loaders ────────────────────────────────────────────────────────
  loadAllSections(): void {
    this.loadKpi();
    this.loadTrend();
    this.loadTable();
    this.loadBar();
    this.loadRanking();
    this.loadVelocity();
    this.loadGap();
    this.loadEvolution();
    this.loadHeatmap();
    this.loadCorrelation();
  }

  loadKpi(): void {
    if (!this.country_uuid) return;
    this.isLoadingKpi.set(true);
    this.sishService.SishSummaryKPI(this.geoParams).subscribe({
      next: res => { this.kpiData.set(res.data); this.isLoadingKpi.set(false); },
      error: ()  => this.isLoadingKpi.set(false),
    });
  }

  loadTrend(): void {
    if (!this.country_uuid) return;
    this.isLoadingTrend.set(true);
    this.sishService.SishLineChartByMonth(this.geoParams).subscribe({
      next: res => {
        const flat: SISHTrendRowModel[] = res.data ?? [];
        const map = new Map<string, SISHTrendSeriesModel>();
        for (const r of flat) {
          if (!map.has(r.brand_uuid)) {
            map.set(r.brand_uuid, { brand_name: r.brand_name, brand_uuid: r.brand_uuid, points: [] });
          }
          map.get(r.brand_uuid)!.points.push(r);
        }
        this.trendData.set([...map.values()]);
        this.buildTrendChart();
        this.isLoadingTrend.set(false);
      },
      error: () => this.isLoadingTrend.set(false),
    });
  }

  loadTable(): void {
    if (!this.country_uuid) return;
    this.isLoadingTable.set(true);
    const call =
      this.geoLevel() === 'province' ? this.sishService.SishTableViewProvince(this.geoParams)
    : this.geoLevel() === 'area'     ? this.sishService.SishTableViewArea(this.geoParams)
    : this.geoLevel() === 'subarea'  ? this.sishService.SishTableViewSubArea(this.geoParams)
    :                                  this.sishService.SishTableViewCommune(this.geoParams);
    call.subscribe({
      next: res => { this.tableData.set(res.data ?? []); this.isLoadingTable.set(false); },
      error: ()  => this.isLoadingTable.set(false),
    });
  }

  loadBar(): void {
    if (!this.country_uuid) return;
    this.isLoadingBar.set(true);
    const call =
      this.geoLevel() === 'province' ? this.sishService.SishBarChartProvince(this.geoParams)
    : this.geoLevel() === 'area'     ? this.sishService.SishBarChartArea(this.geoParams)
    : this.geoLevel() === 'subarea'  ? this.sishService.SishBarChartSubArea(this.geoParams)
    :                                  this.sishService.SishBarChartCommune(this.geoParams);
    call.subscribe({
      next: res => {
        const flat: SISHBarRawRowModel[] = res.data ?? [];
        const map = new Map<string, SISHBarGroupModel>();
        for (const r of flat) {
          if (!map.has(r.territory_uuid)) {
            map.set(r.territory_uuid, {
              territory_name: r.territory_name,
              territory_uuid: r.territory_uuid,
              total_sold: r.total_sold,
              brands: [],
            });
          }
          map.get(r.territory_uuid)!.brands.push(r);
        }
        this.barData.set([...map.values()]);
        this.buildBarChart();
        this.isLoadingBar.set(false);
      },
      error: () => this.isLoadingBar.set(false),
    });
  }

  loadRanking(): void {
    if (!this.country_uuid) return;
    this.isLoadingRanking.set(true);
    this.sishService.SishBrandRanking(this.geoParams).subscribe({
      next: res => {
        this.rankingData.set(res.data ?? []);
        this.buildRankingChart();
        this.isLoadingRanking.set(false);
      },
      error: () => this.isLoadingRanking.set(false),
    });
  }

  loadVelocity(): void {
    if (!this.country_uuid) return;
    this.isLoadingVelocity.set(true);
    this.sishService.SishVelocityIndex(this.geoParams).subscribe({
      next: res => {
        this.velocityData.set(res.data ?? []);
        this.buildVelocityChart();
        this.isLoadingVelocity.set(false);
      },
      error: () => this.isLoadingVelocity.set(false),
    });
  }

  loadGap(): void {
    if (!this.country_uuid) return;
    this.isLoadingGap.set(true);
    this.sishService.SishGapAnalysis(this.geoParams).subscribe({
      next: res => {
        this.gapData.set(res.data ?? []);
        this.buildGapChart();
        this.isLoadingGap.set(false);
      },
      error: () => this.isLoadingGap.set(false),
    });
  }

  loadEvolution(): void {
    if (!this.country_uuid) return;
    this.isLoadingEvolution.set(true);
    this.sishService.SishEvolution(this.geoParams).subscribe({
      next: res => {
        this.evolutionData.set(res.data ?? []);
        this.buildEvolutionChart();
        this.isLoadingEvolution.set(false);
      },
      error: () => this.isLoadingEvolution.set(false),
    });
  }

  loadHeatmap(): void {
    if (!this.country_uuid) return;
    this.isLoadingHeatmap.set(true);
    this.sishService.SishHeatmap(this.geoParams, this.heatmapLevel()).subscribe({
      next: res => {
        const raw = res.data ?? {};
        const hm = {
          brands:      raw.brands      ?? [],
          territories: raw.territories ?? [],
          matrix:      raw.matrix      ?? [],
        };
        this.heatmapData.set(hm);
        this.buildHeatmapChart();
        this.isLoadingHeatmap.set(false);
      },
      error: () => this.isLoadingHeatmap.set(false),
    });
  }

  loadCorrelation(): void {
    if (!this.country_uuid) return;
    this.isLoadingCorrelation.set(true);
    this.sishService.SishVsSosCorrelation(this.geoParams).subscribe({
      next: res => {
        this.correlationData.set(res.data ?? []);
        this.buildCorrelationChart();
        this.isLoadingCorrelation.set(false);
      },
      error: () => this.isLoadingCorrelation.set(false),
    });
  }

  loadDrilldown(brandUuid: string, brandName: string): void {
    if (!this.country_uuid || !brandUuid) return;
    this.drillBrand.set({ uuid: brandUuid, name: brandName });
    this.activeSection.set('drilldown');
    this.isLoadingDrilldown.set(true);
    this.sishService.SishPosDrillDown(this.geoParams, brandUuid).subscribe({
      next: res => {
        this.drilldownData.set(res.data ?? []);
        this.isLoadingDrilldown.set(false);
      },
      error: () => this.isLoadingDrilldown.set(false),
    });
  }

  // ── Chart builders ─────────────────────────────────────────────────────────
  buildTrendChart(): void {
    const data = this.trendData();
    if (!data.length) { this.chartTrendOpts.set(null); return; }
    const months = [...new Set(data.flatMap(s => s.points.map(p => p.month)))].sort();
    const sishSeries = data.map((s, i) => ({
      name: `${s.brand_name} (SISH)`,
      data: months.map(m => s.points.find(p => p.month === m)?.sish_percent ?? 0),
      color: this.BRAND_COLORS[i % this.BRAND_COLORS.length],
    }));
    const sosSeries = data.slice(0, 3).map((s, i) => ({
      name: `${s.brand_name} (SOS)`,
      data: months.map(m => s.points.find(p => p.month === m)?.sos_percent ?? 0),
      color: this.BRAND_COLORS[i % this.BRAND_COLORS.length],
      dashArray: 5,
    }));
    const allSeries = [...sishSeries]; // show SISH by default; SOS toggleable via legend
    this.chartTrendOpts.set({
      series: allSeries,
      chart:      { type: 'line', height: 340, toolbar: { show: true }, zoom: { enabled: false } },
      colors:     this.BRAND_COLORS.slice(0, allSeries.length),
      stroke:     { curve: 'smooth', width: 2.5 },
      markers:    { size: 4, hover: { size: 6 } },
      dataLabels: { enabled: false },
      xaxis:      { categories: months, labels: { rotate: -30 } },
      yaxis:      {
        title: { text: 'SISH %' },
        labels: { formatter: (v: number) => `${v.toFixed(1)}%` },
        min: 0, max: 100,
      },
      legend: { position: 'top' },
      tooltip: {
        shared: true, intersect: false,
        y: { formatter: (v: number) => `${v.toFixed(1)}%` },
      },
      grid:        { strokeDashArray: 4 },
      annotations: {
        yaxis: [{ y: 33, borderColor: '#e11d48', strokeDashArray: 4, label: { text: 'Seuil 33%', position: 'right', style: { color: '#e11d48', fontSize: '10px' } } }],
      },
    });
  }

  buildBarChart(): void {
    const data = this.barData();
    if (!data.length) { this.chartBarOpts.set(null); return; }
    const allBrands   = [...new Set(data.flatMap(g => g.brands.map(b => b.brand_name)))];
    const territories = data.map(g => g.territory_name);
    const series = allBrands.map(brand => ({
      name: brand,
      data: data.map(g => g.brands.find(b => b.brand_name === brand)?.sish_percent ?? 0),
    }));
    this.chartBarOpts.set({
      series,
      chart:       { type: 'bar', height: 360, toolbar: { show: false } },
      colors:      this.BRAND_COLORS.slice(0, allBrands.length),
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: territories, labels: { rotate: -30 } },
      yaxis:       {
        title: { text: 'SISH %' },
        min: 0, max: 100,
        labels: { formatter: (v: number) => `${v.toFixed(1)}%` },
      },
      legend:  { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildRankingChart(): void {
    const data = this.rankingData();
    if (!data.length) { this.chartRankingOpts.set(null); return; }
    const top10 = data.slice(0, 10);
    this.chartRankingOpts.set({
      series: [
        { name: 'SISH %', data: top10.map(d => +d.sish_percent.toFixed(1)) },
        { name: 'SOS %',  data: top10.map(d => +d.sos_percent.toFixed(1)) },
      ],
      chart:       { type: 'bar', height: 320, toolbar: { show: false } },
      colors:      ['#e11d48', '#6366f1'],
      plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 3 } },
      dataLabels:  {
        enabled: true, offsetX: 4,
        style: { fontSize: '10px' },
        formatter: (v: number) => `${v}%`,
      },
      xaxis:   { categories: top10.map(d => d.brand_name), labels: { formatter: (v: number) => `${v}%` }, max: 100 },
      legend:  { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v}%` } },
    });
  }

  buildVelocityChart(): void {
    const data = this.velocityData();
    if (!data.length) { this.chartVelocityOpts.set(null); return; }
    const velColors = data.map(d =>
      d.velocity_category === 'fast_mover' ? '#10b981'
      : d.velocity_category === 'aligned'  ? '#0ea5e9'
      : '#f43f5e'
    );
    this.chartVelocityOpts.set({
      series: [{ name: 'Velocity Index', data: data.map(d => +d.velocity_index.toFixed(3)) }],
      chart:       { type: 'bar', height: 320, toolbar: { show: false } },
      colors:      velColors,
      plotOptions: {
        bar: {
          horizontal: true, barHeight: '65%', borderRadius: 3,
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true, offsetX: 4,
        style: { fontSize: '10px' },
        formatter: (v: number) => v.toFixed(2),
      },
      xaxis:  { categories: data.map(d => d.brand_name), labels: { formatter: (v: number) => v.toFixed(1) } },
      yaxis:  { title: { text: '' } },
      legend: { show: false },
      tooltip: {
        custom: ({ dataPointIndex, w }: any) => {
          const d = data[dataPointIndex];
          if (!d) return '';
          return `<div class="sish-tooltip-scatter">
            <strong>${d.brand_name}</strong><br/>
            Velocity: ${d.velocity_index.toFixed(3)}<br/>
            SISH: ${d.sish_percent}% &nbsp;|&nbsp; SOS: ${d.sos_percent}%<br/>
            Stock turn: ${d.stock_turn_days > 0 ? d.stock_turn_days + ' j' : '—'}
          </div>`;
        },
      },
      annotations: {
        xaxis: [
          { x: 1, borderColor: '#94a3b8', strokeDashArray: 4, label: { text: 'Equilibre = 1', style: { color: '#64748b', fontSize: '10px' } } },
          { x: 1.1, borderColor: '#10b981', strokeDashArray: 6, opacity: 0.3 },
          { x: 0.9, borderColor: '#f43f5e', strokeDashArray: 6, opacity: 0.3 },
        ],
      },
    });
  }

  buildGapChart(): void {
    const data = this.gapData();
    if (!data.length) { this.chartGapOpts.set(null); return; }
    const sorted = [...data].sort((a, b) => b.gap - a.gap);
    const colors = sorted.map(d => d.status === 'above_target' ? '#10b981' : '#f43f5e');
    this.chartGapOpts.set({
      series: [{ name: 'Gap vs Cible (pp)', data: sorted.map(d => +d.gap.toFixed(1)) }],
      chart:       { type: 'bar', height: 320, toolbar: { show: false } },
      colors,
      plotOptions: {
        bar: { horizontal: true, barHeight: '55%', borderRadius: 3, distributed: true },
      },
      dataLabels: {
        enabled: true, offsetX: 4,
        style: { fontSize: '10px' },
        formatter: (v: number) => {
          const sign = v > 0 ? '+' : '';
          return `${sign}${v.toFixed(1)} pp`;
        },
      },
      xaxis:  { categories: sorted.map(d => d.brand_name), labels: { formatter: (v: number) => `${v > 0 ? '+' : ''}${v}pp` } },
      legend: { show: false },
      tooltip: {
        custom: ({ dataPointIndex, w }: any) => {
          const d = sorted[dataPointIndex];
          if (!d) return '';
          return `<div class="sish-tooltip-scatter">
            <strong>${d.brand_name}</strong><br/>
            SISH: ${d.sish_percent}% &nbsp;|&nbsp; Cible: ${d.equal_share_target}%<br/>
            Gap: ${d.gap > 0 ? '+' : ''}${d.gap.toFixed(1)} pp<br/>
            Manque: ${d.gap_units > 0 ? Math.round(d.gap_units) + ' unités' : '— (au-dessus)'}
          </div>`;
        },
      },
    });
  }

  buildEvolutionChart(): void {
    const data = this.evolutionData();
    if (!data.length) { this.chartEvolutionOpts.set(null); return; }
    this.chartEvolutionOpts.set({
      series: [
        { name: 'SISH% Courant',    data: data.map(d => d.current_sish_percent),  type: 'bar' },
        { name: 'SISH% Précédent',  data: data.map(d => d.previous_sish_percent), type: 'bar' },
        { name: 'Δ SISH (pp)',      data: data.map(d => d.delta),                 type: 'line' },
        { name: 'Δ Velocity',       data: data.map(d => d.velocity_delta),        type: 'line' },
      ],
      chart:       { height: 340, toolbar: { show: false } },
      colors:      ['#e11d48', '#fda4af', '#f59e0b', '#10b981'],
      stroke:      { width: [0, 0, 2.5, 2.5], curve: 'smooth', dashArray: [0, 0, 0, 5] },
      plotOptions: { bar: { horizontal: false, columnWidth: '40%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: data.map(d => d.brand_name), labels: { rotate: -30 } },
      yaxis: [
        { seriesName: 'SISH% Courant',   title: { text: 'SISH %' }, labels: { formatter: (v: number) => `${v}%` } },
        { seriesName: 'SISH% Précédent', show: false },
        {
          seriesName: 'Δ SISH (pp)', opposite: true,
          title: { text: 'Δ' },
          labels: { formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}` },
        },
        { seriesName: 'Δ Velocity', show: false },
      ],
      legend:  { position: 'top' },
      tooltip: { shared: true, intersect: false },
    });
  }

  buildHeatmapChart(): void {
    const hm = this.heatmapData();
    if (!hm?.brands?.length) { this.chartHeatmapOpts.set(null); return; }
    const { brands, territories, matrix } = hm;
    const series = brands.map((b, bi) => ({
      name: b.name,
      data: territories.map((t, ti) => ({ x: t.name, y: matrix[bi][ti] })),
    }));
    this.chartHeatmapOpts.set({
      series,
      chart: {
        type: 'heatmap',
        height: Math.max(240, brands.length * 44),
        toolbar: { show: false },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '9px' },
        formatter: (v: number) => v > 0 ? `${v}%` : '',
      },
      colors: ['#e11d48'],
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.7,
          radius: 3,
          enableShades: true,
          colorScale: {
            ranges: [
              { from: 0,  to: 0,   color: '#fff1f2', name: 'Absent'    },
              { from: 1,  to: 20,  color: '#fecdd3', name: 'Faible'    },
              { from: 21, to: 40,  color: '#fb7185', name: 'Moyen'     },
              { from: 41, to: 65,  color: '#e11d48', name: 'Bon'       },
              { from: 66, to: 100, color: '#9f1239', name: 'Excellent' },
            ],
          },
        },
      },
      legend:  { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v}%` } },
    });
  }

  buildCorrelationChart(): void {
    const data = this.correlationData();
    if (!data.length) { this.chartCorrelationOpts.set(null); return; }
    const posColors: Record<string, string> = {
      fast_leader:       '#10b981',
      sell_through_star: '#0ea5e9',
      shelf_hoarder:     '#f59e0b',
      underperformer:    '#f43f5e',
    };
    const byPos: Record<string, { x: number; y: number; brand: string }[]> = {
      fast_leader: [], sell_through_star: [], shelf_hoarder: [], underperformer: [],
    };
    for (const d of data) byPos[d.position]?.push({ x: d.sish_percent, y: d.sos_percent, brand: d.brand_name });

    const series = Object.entries(byPos)
      .filter(([, pts]) => pts.length)
      .map(([pos, pts]) => ({
        name: this.getPosLabel(pos),
        data: pts.map(p => ({ x: p.x, y: p.y })),
      }));

    // avg SISH as x-axis midline
    const avgSish = data.length ? data.reduce((s, d) => s + d.sish_percent, 0) / data.length : 33;

    this.chartCorrelationOpts.set({
      series,
      chart:      { type: 'scatter', height: 400, toolbar: { show: false }, zoom: { enabled: true } },
      colors:     [posColors['fast_leader'], posColors['sell_through_star'], posColors['shelf_hoarder'], posColors['underperformer']],
      dataLabels: { enabled: false },
      markers:    { size: 9, hover: { size: 11 } },
      xaxis: {
        title: { text: 'SISH %' },
        min: 0, max: 100,
        labels: { formatter: (v: number) => `${v}%` },
      },
      yaxis: {
        title: { text: 'SOS %' },
        min: 0, max: 100,
        labels: { formatter: (v: number) => `${v}%` },
      },
      annotations: {
        xaxis: [{ x: avgSish, borderColor: '#94a3b8', strokeDashArray: 5, label: { text: `SISH moy ${avgSish.toFixed(1)}%`, position: 'bottom', style: { color: '#64748b', fontSize: '9px' } } }],
        yaxis: [{ y: 33, borderColor: '#94a3b8', strokeDashArray: 5, label: { text: 'SOS 33%', style: { color: '#64748b', fontSize: '9px' } } }],
      },
      legend:  { position: 'top' },
      tooltip: {
        shared: false, intersect: true,
        custom: ({ dataPointIndex, seriesIndex, w }: any) => {
          const pt = w.config.series[seriesIndex]?.data?.[dataPointIndex];
          if (!pt) return '';
          const match = data.find(d => Math.abs(d.sish_percent - pt.x) < 0.01 && Math.abs(d.sos_percent - pt.y) < 0.01);
          return `<div class="sish-tooltip-scatter">
            <strong>${match?.brand_name ?? ''}</strong><br/>
            SISH: ${pt.x}% &nbsp;|&nbsp; SOS: ${pt.y}%<br/>
            Velocity: ${match?.velocity_index.toFixed(2) ?? '—'}<br/>
            Position: ${match ? this.getPosLabel(match.position) : '—'}
          </div>`;
        },
      },
    });
  }

  // ── Geo event handlers ─────────────────────────────────────────────────────
  onCountryChange(country: ICountry): void {
    this.selectedCountry  = country;
    this.selectedProvince = undefined;
    this.selectedArea     = undefined;
    this.selectedSubArea  = undefined;
    this.selectedCommune  = undefined;
    this.provinceList.set([]);
    this.areaList.set([]);
    this.subAreaList.set([]);
    this.communeList.set([]);
    this.provinceService.getAll().subscribe(res => {
      this.provinceList.set(res.data.filter((p: IProvince) => p.country_uuid === country.uuid));
    });
    this.loadAllSections();
  }

  onProvinceChange(province: IProvince): void {
    this.selectedProvince = province;
    this.selectedArea     = undefined;
    this.selectedSubArea  = undefined;
    this.selectedCommune  = undefined;
    this.areaList.set([]);
    this.subAreaList.set([]);
    this.communeList.set([]);
    if (province) {
      this.areaService.getAll().subscribe(res => {
        this.areaList.set(res.data.filter((a: IArea) => a.province_uuid === province.uuid));
      });
    }
    this.loadAllSections();
  }

  onAreaChange(area: IArea): void {
    this.selectedArea    = area;
    this.selectedSubArea = undefined;
    this.selectedCommune = undefined;
    this.subAreaList.set([]);
    this.communeList.set([]);
    if (area) {
      this.subAreaService.getAll().subscribe(res => {
        this.subAreaList.set(res.data.filter((s: ISubArea) => s.area_uuid === area.uuid));
      });
    }
    this.loadAllSections();
  }

  onSubAreaChange(subArea: ISubArea): void {
    this.selectedSubArea = subArea;
    this.selectedCommune = undefined;
    this.communeList.set([]);
    if (subArea) {
      this.communeService.getAll().subscribe(res => {
        this.communeList.set(res.data.filter((c: ICommune) => c.sub_area_uuid === subArea.uuid));
      });
    }
    this.loadAllSections();
  }

  onCommuneChange(commune: ICommune): void {
    this.selectedCommune = commune;
    this.loadAllSections();
  }

  onGeoLevelChange(level: GeoLevel): void {
    this.geoLevel.set(level);
    this.loadTable();
    this.loadBar();
  }

  onHeatmapLevelChange(level: GeoLevel): void {
    this.heatmapLevel.set(level);
    this.loadHeatmap();
  }

  setSection(section: SISHSection): void {
    this.activeSection.set(section);
  }

  setPeriod(key: string): void {
    this.selectedPeriod.set(key);
    if (key === 'custom') return;
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;
    let end: Date = new Date(today);
    switch (key) {
      case 'today': start = new Date(today); break;
      case '1w':    start = new Date(today); start.setDate(today.getDate() - 7); break;
      case '1m':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case '3m': start = new Date(today); start.setMonth(today.getMonth() - 3); break;
      case '6m': start = new Date(today); start.setMonth(today.getMonth() - 6); break;
      case '1y': start = new Date(today); start.setFullYear(today.getFullYear() - 1); break;
      default: return;
    }
    this.start_date = formatDate(start, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(end,   'yyyy-MM-dd', 'en-US');
    this.loadAllSections();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getPeriodLabel(): string {
    return this.PERIODS.find(p => p.key === this.selectedPeriod())?.label ?? 'Période';
  }

  getTrendClass(value: number): string {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }

  getSishBadge(sish: number): string {
    if (sish >= 40) return 'badge bg-success';
    if (sish >= 20) return 'badge bg-warning text-dark';
    return 'badge bg-danger';
  }

  getSishProgressClass(sish: number): string {
    if (sish >= 40) return 'bg-success';
    if (sish >= 20) return 'bg-warning';
    return 'bg-danger';
  }

  getVelocityBadge(vel: number): string {
    if (vel > 1.1) return 'badge bg-success';
    if (vel >= 0.9) return 'badge bg-info text-dark';
    return 'badge bg-danger';
  }

  getVelocityCatBadge(cat: string): string {
    const map: Record<string, string> = {
      fast_mover: 'badge bg-success-subtle text-success',
      aligned:    'badge bg-info-subtle text-info',
      slow_mover: 'badge bg-danger-subtle text-danger',
    };
    return map[cat] ?? 'badge bg-secondary';
  }

  getVelocityCatLabel(cat: string): string {
    const map: Record<string, string> = {
      fast_mover: 'Rapide ↑',
      aligned:    'Équilibré',
      slow_mover: 'Lent ↓',
    };
    return map[cat] ?? cat;
  }

  getCategoryBadge(cat: string): string {
    const map: Record<string, string> = {
      market_leader: 'badge bg-success',
      challenger:    'badge bg-warning text-dark',
      niche:         'badge bg-secondary',
    };
    return map[cat] ?? 'badge bg-secondary';
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      market_leader: 'Leader',
      challenger:    'Challenger',
      niche:         'Niche',
    };
    return map[cat] ?? cat;
  }

  getPosBadge(pos: string): string {
    const map: Record<string, string> = {
      fast_leader:       'badge bg-success',
      sell_through_star: 'badge bg-info text-dark',
      shelf_hoarder:     'badge bg-warning text-dark',
      underperformer:    'badge bg-danger',
    };
    return map[pos] ?? 'badge bg-secondary';
  }

  getPosLabel(pos: string): string {
    const map: Record<string, string> = {
      fast_leader:       'Fast Leader 🚀',
      sell_through_star: 'Star Vente ⭐',
      shelf_hoarder:     'Accumulateur 📦',
      underperformer:    'Sous-performer ⚠️',
    };
    return map[pos] ?? pos;
  }

  getPosCount(pos: string): number {
    return this.correlationData().filter(d => d.position === pos).length;
  }

  getTrendBadge(trend: string): string {
    if (trend === 'gaining') return 'badge bg-success-subtle text-success';
    if (trend === 'losing')  return 'badge bg-danger-subtle text-danger';
    return 'badge bg-secondary-subtle text-secondary';
  }

  getTrendLabel(trend: string): string {
    if (trend === 'gaining') return '↑ En hausse';
    if (trend === 'losing')  return '↓ En baisse';
    return '→ Stable';
  }

  getGapBadge(status: string): string {
    return status === 'above_target' ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger';
  }

  getGapLabel(status: string): string {
    return status === 'above_target' ? 'Objectif atteint' : 'Sous objectif';
  }

  getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  formatSold(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
    return v.toFixed(0);
  }

  formatEntropy(e: number): string {
    if (e < 1.5) return 'Très concentré';
    if (e < 2.5) return 'Concentré';
    if (e < 3.0) return 'Modéré';
    return 'Diversifié';
  }

  getEntropyBadge(e: number): string {
    if (e < 1.5) return 'badge bg-danger';
    if (e < 2.5) return 'badge bg-warning text-dark';
    if (e < 3.0) return 'badge bg-info text-dark';
    return 'badge bg-success';
  }
}

