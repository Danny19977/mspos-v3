import {
  AfterViewChecked,
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
import { BsDaterangepickerDirective } from 'ngx-bootstrap/datepicker';

import { routes } from '../../../shared/routes/routes';
import { CommonService } from '../../../shared/common/common.service';
import { AuthService } from '../../../auth/auth.service';
import { WsService } from '../services/ws.service';
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
  WSSummaryKPIModel,
  WSBrandRankModel,
  WSGapRowModel,
  WSEvolutionRowModel,
  WSHeatmapModel,
  WSHeatmapRawRowModel,
  WSTrendSeriesModel,
  WSTrendRowModel,
  WSTableRowModel,
  WSBarGroupModel,
  WSBarRawRowModel,
  WSvsNDRowModel,
  WSPosDrillRowModel,
} from '../models/dashboard.models';

export type WSSection =
  | 'kpi' | 'trend' | 'tableview' | 'barchart'
  | 'ranking' | 'gap' | 'evolution' | 'heatmap'
  | 'correlation' | 'drilldown';

export type GeoLevel = 'province' | 'area' | 'subarea' | 'commune';

@Component({
  selector: 'app-ws-dashboard',
  standalone: false,
  templateUrl: './ws-dashboard.component.html',
  styleUrl: './ws-dashboard.component.scss',
})
export class WsDashboardComponent implements OnInit, AfterViewChecked {

  // ── DI ────────────────────────────────────────────────────────────────────
  private common          = inject(CommonService);
  private renderer        = inject(Renderer2);
  private fb              = inject(FormBuilder);
  private cdr             = inject(ChangeDetectorRef);
  private authService     = inject(AuthService);
  private wsService       = inject(WsService);
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
  activeSection  = signal<WSSection>('kpi');
  geoLevel       = signal<GeoLevel>('province');
  heatmapLevel   = signal<GeoLevel>('province');

  // ── WS vs ND threshold ─────────────────────────────────────────────────────
  correlationThreshold = signal<number>(50);

  // ── Drill-down state ───────────────────────────────────────────────────────
  drillBrand = signal<{ uuid: string; name: string } | null>(null);

  // ── Loading flags ──────────────────────────────────────────────────────────
  isLoadingKpi         = signal(false);
  isLoadingTrend       = signal(false);
  isLoadingTable       = signal(false);
  isLoadingBar         = signal(false);
  isLoadingRanking     = signal(false);
  isLoadingGap         = signal(false);
  isLoadingEvolution   = signal(false);
  isLoadingHeatmap     = signal(false);
  isLoadingCorrelation = signal(false);
  isLoadingDrilldown   = signal(false);

  // ── Data signals ───────────────────────────────────────────────────────────
  kpiData         = signal<WSSummaryKPIModel | null>(null);
  trendData       = signal<WSTrendSeriesModel[]>([]);
  tableData       = signal<WSTableRowModel[]>([]);
  barData         = signal<WSBarGroupModel[]>([]);
  rankingData     = signal<WSBrandRankModel[]>([]);
  gapData         = signal<WSGapRowModel[]>([]);
  evolutionData   = signal<WSEvolutionRowModel[]>([]);
  heatmapData     = signal<WSHeatmapModel>({ brands: [], territories: [], matrix: [] });
  correlationData = signal<WSvsNDRowModel[]>([]);
  drilldownData   = signal<WSPosDrillRowModel[]>([]);

  // ── Chart options ──────────────────────────────────────────────────────────
  chartTrendOpts       = signal<any>(null);
  chartBarOpts         = signal<any>(null);
  chartGapOpts         = signal<any>(null);
  chartEvolutionOpts   = signal<any>(null);
  chartHeatmapOpts     = signal<any>(null);
  chartRankingOpts     = signal<any>(null);
  chartCorrelationOpts = signal<any>(null);

  // ── Table view grouping ────────────────────────────────────────────────────
  tableGrouped = computed<{ territory_name: string; territory_uuid: string; rows: WSTableRowModel[] }[]>(() => {
    const map = new Map<string, WSTableRowModel[]>();
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

  // ── Gap zone computed ──────────────────────────────────────────────────────
  gapZoneCounts = computed(() => {
    const counts = { strong: 0, mid: 0, weak: 0 };
    for (const r of this.gapData()) {
      if (r.zone in counts) counts[r.zone as keyof typeof counts]++;
    }
    return counts;
  });

  // ── Chart ViewChilds ───────────────────────────────────────────────────────
  private _openPickerOnNextCheck = false;
  @ViewChild('dateRangeInput') dateRangePicker?: BsDaterangepickerDirective;
  @ViewChild('chartTrend')       chartTrendRef!:       ChartComponent;
  @ViewChild('chartBar')         chartBarRef!:         ChartComponent;
  @ViewChild('chartGap')         chartGapRef!:         ChartComponent;

  readonly BRAND_COLORS = [
    '#0ea5e9','#2dd4bf','#a855f7','#f97316','#10b981',
    '#f43f5e','#6366f1','#eab308','#14b8a6','#8b5cf6',
    '#ec4899','#3b82f6','#84cc16','#f59e0b','#06b6d4',
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngAfterViewChecked(): void {
    if (this._openPickerOnNextCheck && this.dateRangePicker) {
      this._openPickerOnNextCheck = false;
      this.dateRangePicker.show();
    }
  }

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
    this.loadGap();
    this.loadEvolution();
    this.loadHeatmap();
    this.loadCorrelation();
  }

  loadKpi(): void {
    if (!this.country_uuid) return;
    this.isLoadingKpi.set(true);
    this.wsService.WsSummaryKPI(this.geoParams).subscribe({
      next: res => { this.kpiData.set(res.data); this.isLoadingKpi.set(false); },
      error: ()  => this.isLoadingKpi.set(false),
    });
  }

  loadTrend(): void {
    if (!this.country_uuid) return;
    this.isLoadingTrend.set(true);
    this.wsService.WsLineChartByMonth(this.geoParams).subscribe({
      next: res => {
        const flat: WSTrendRowModel[] = res.data ?? [];
        const map = new Map<string, WSTrendSeriesModel>();
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
      this.geoLevel() === 'province' ? this.wsService.WsTableViewProvince(this.geoParams)
    : this.geoLevel() === 'area'     ? this.wsService.WsTableViewArea(this.geoParams)
    : this.geoLevel() === 'subarea'  ? this.wsService.WsTableViewSubArea(this.geoParams)
    :                                  this.wsService.WsTableViewCommune(this.geoParams);
    call.subscribe({
      next: res => { this.tableData.set(res.data ?? []); this.isLoadingTable.set(false); },
      error: ()  => this.isLoadingTable.set(false),
    });
  }

  loadBar(): void {
    if (!this.country_uuid) return;
    this.isLoadingBar.set(true);
    const call =
      this.geoLevel() === 'province' ? this.wsService.WsBarChartProvince(this.geoParams)
    : this.geoLevel() === 'area'     ? this.wsService.WsBarChartArea(this.geoParams)
    : this.geoLevel() === 'subarea'  ? this.wsService.WsBarChartSubArea(this.geoParams)
    :                                  this.wsService.WsBarChartCommune(this.geoParams);
    call.subscribe({
      next: res => {
        const flat: WSBarRawRowModel[] = res.data ?? [];
        const map = new Map<string, WSBarGroupModel>();
        for (const r of flat) {
          if (!map.has(r.territory_uuid)) {
            map.set(r.territory_uuid, {
              territory_name: r.territory_name,
              territory_uuid: r.territory_uuid,
              total_sold: r.total_sold,
              brands: [],
            });
          }
          map.get(r.territory_uuid)!.brands.push({
            brand_name: r.brand_name,
            brand_uuid: r.brand_uuid,
            brand_sold: r.brand_sold,
            total_sold: r.total_sold,
            ws_percent: r.ws_percent,
          });
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
    this.wsService.WsBrandRanking(this.geoParams).subscribe({
      next: res => {
        this.rankingData.set(res.data ?? []);
        this.buildRankingChart();
        this.isLoadingRanking.set(false);
      },
      error: () => this.isLoadingRanking.set(false),
    });
  }

  loadGap(): void {
    if (!this.country_uuid) return;
    this.isLoadingGap.set(true);
    this.wsService.WsGapAnalysis(this.geoParams).subscribe({
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
    this.wsService.WsEvolution(this.geoParams).subscribe({
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
    this.wsService.WsHeatmap(this.geoParams, this.heatmapLevel()).subscribe({
      next: res => {
        // Assemble matrix from flat rows
        const flat: WSHeatmapRawRowModel[] = res.data ?? [];
        const brandMap  = new Map<string, string>();
        const terrMap   = new Map<string, string>();
        for (const r of flat) {
          brandMap.set(r.brand_uuid, r.brand_name);
          terrMap.set(r.territory_uuid, r.territory_name);
        }
        const brands      = [...brandMap.entries()].map(([uuid, name]) => ({ uuid, name }));
        const territories = [...terrMap.entries()].map(([uuid, name]) => ({ uuid, name }));
        const matrix: number[][] = brands.map(b =>
          territories.map(t => {
            const r = flat.find(f => f.brand_uuid === b.uuid && f.territory_uuid === t.uuid);
            return r?.ws_percent ?? 0;
          })
        );
        this.heatmapData.set({ brands, territories, matrix });
        this.buildHeatmapChart();
        this.isLoadingHeatmap.set(false);
      },
      error: () => this.isLoadingHeatmap.set(false),
    });
  }

  loadCorrelation(): void {
    if (!this.country_uuid) return;
    this.isLoadingCorrelation.set(true);
    this.wsService.WsVsNDCorrelation(this.geoParams, this.correlationThreshold()).subscribe({
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
    this.wsService.WsPosDrillDown(this.geoParams, brandUuid).subscribe({
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
    const series = data.map(s => ({
      name: s.brand_name,
      data: months.map(m => s.points.find(p => p.month === m)?.ws_percent ?? 0),
    }));
    this.chartTrendOpts.set({
      series,
      chart:      { type: 'line', height: 320, toolbar: { show: false } },
      colors:     this.BRAND_COLORS.slice(0, series.length),
      stroke:     { curve: 'smooth', width: 2.5 },
      markers:    { size: 4, hover: { size: 6 } },
      dataLabels: { enabled: false },
      xaxis:      { categories: months, labels: { rotate: -30 } },
      yaxis:      { title: { text: 'WS %' }, labels: { formatter: (v: number) => `${v}%` }, min: 0, max: 100 },
      legend:     { position: 'top' },
      tooltip:    {
        shared: true, intersect: false,
        y: { formatter: (v: number) => `${v.toFixed(1)}%` },
      },
      grid: { strokeDashArray: 4 },
    });
  }

  buildBarChart(): void {
    const data = this.barData();
    if (!data.length) { this.chartBarOpts.set(null); return; }
    const allBrands   = [...new Set(data.flatMap(g => g.brands.map(b => b.brand_name)))];
    const territories = data.map(g => g.territory_name);
    const series = allBrands.map(brand => ({
      name: brand,
      data: data.map(g => g.brands.find(b => b.brand_name === brand)?.ws_percent ?? 0),
    }));
    this.chartBarOpts.set({
      series,
      chart:       { type: 'bar', height: 340, toolbar: { show: false } },
      colors:      this.BRAND_COLORS.slice(0, allBrands.length),
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: territories, labels: { rotate: -30 } },
      yaxis:       { title: { text: 'WS %' }, min: 0, max: 100, labels: { formatter: (v: number) => `${v}%` } },
      legend:      { position: 'top' },
      tooltip:     { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildGapChart(): void {
    const data = this.gapData();
    if (!data.length) { this.chartGapOpts.set(null); return; }
    const strong = data.filter(d => d.zone === 'strong');
    const mid    = data.filter(d => d.zone === 'mid');
    const weak   = data.filter(d => d.zone === 'weak');
    this.chartGapOpts.set({
      series: [
        { name: 'Fort (≥ 66%)',    data: strong.map(d => +d.ws_percent.toFixed(1)) },
        { name: 'Moyen (33–66%)',  data: mid.map(d => +d.ws_percent.toFixed(1)) },
        { name: 'Faible (< 33%)', data: weak.map(d => +d.ws_percent.toFixed(1)) },
      ],
      chart:       { type: 'bar', height: 300, stacked: false, toolbar: { show: false } },
      colors:      ['#10b981', '#f59e0b', '#f43f5e'],
      plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 3 } },
      dataLabels:  { enabled: true, formatter: (v: number) => `${v}%` },
      xaxis:       { categories: data.map(d => d.brand_name), max: 100, labels: { formatter: (v: number) => `${v}%` } },
      legend:      { position: 'top' },
      tooltip:     { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildEvolutionChart(): void {
    const data = this.evolutionData();
    if (!data.length) { this.chartEvolutionOpts.set(null); return; }
    this.chartEvolutionOpts.set({
      series: [
        { name: 'WS% Courant',   data: data.map(d => d.curr_ws_percent),  type: 'bar' },
        { name: 'WS% Précédent', data: data.map(d => d.prev_ws_percent),  type: 'bar' },
        { name: 'Delta (pp)',    data: data.map(d => d.delta_ws),          type: 'line' },
      ],
      chart:       { height: 320, toolbar: { show: false } },
      colors:      ['#0ea5e9', '#94a3b8', '#f43f5e'],
      stroke:      { width: [0, 0, 2.5], curve: 'smooth' },
      plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: data.map(d => d.brand_name), labels: { rotate: -30 } },
      yaxis: [
        { seriesName: 'WS% Courant',   title: { text: 'WS %' }, labels: { formatter: (v: number) => `${v}%` } },
        { seriesName: 'WS% Précédent', show: false },
        {
          seriesName: 'Delta (pp)', opposite: true,
          title: { text: 'Δ pp' },
          labels: { formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}pp` },
        },
      ],
      legend:  { position: 'top' },
      tooltip: { shared: true, intersect: false },
    });
  }

  buildRankingChart(): void {
    const data = this.rankingData();
    if (!data.length) { this.chartRankingOpts.set(null); return; }
    const top10 = data.slice(0, 10);
    this.chartRankingOpts.set({
      series: [{ name: 'WS %', data: top10.map(d => d.ws_percent) }],
      chart:       { type: 'bar', height: 300, toolbar: { show: false } },
      colors:      ['#0ea5e9'],
      plotOptions: {
        bar: {
          horizontal: true, barHeight: '65%', borderRadius: 4,
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: {
        enabled: true, offsetX: 4,
        style: { fontSize: '11px' },
        formatter: (v: number) => `${v}%`,
      },
      xaxis:   { categories: top10.map(d => d.brand_name), labels: { formatter: (v: number) => `${v}%` }, max: 100 },
      legend:  { show: false },
      tooltip: { y: { formatter: (v: number) => `${v}%` } },
    });
  }

  buildHeatmapChart(): void {
    const hm = this.heatmapData();
    if (!hm.brands.length) { this.chartHeatmapOpts.set(null); return; }
    const { brands, territories, matrix } = hm;
    const series = brands.map((b, bi) => ({
      name: b.name,
      data: territories.map((t, ti) => ({ x: t.name, y: matrix[bi][ti] })),
    }));
    this.chartHeatmapOpts.set({
      series,
      chart: {
        type: 'heatmap',
        height: Math.max(220, brands.length * 44),
        toolbar: { show: false },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '10px' },
        formatter: (v: number) => v > 0 ? `${v}%` : '',
      },
      colors: ['#0ea5e9'],
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.7,
          radius: 3,
          enableShades: true,
          colorScale: {
            ranges: [
              { from: 0,  to: 0,   color: '#f0f9ff', name: 'Absent'    },
              { from: 1,  to: 25,  color: '#bae6fd', name: 'Faible'    },
              { from: 26, to: 50,  color: '#38bdf8', name: 'Moyen'     },
              { from: 51, to: 75,  color: '#0ea5e9', name: 'Bon'       },
              { from: 76, to: 100, color: '#0369a1', name: 'Excellent' },
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
    const threshold = this.correlationThreshold();
    const segColors: Record<string, string> = {
      leader:  '#10b981',
      niche:   '#0ea5e9',
      volume:  '#f59e0b',
      laggard: '#f43f5e',
    };
    const bySeg: Record<string, any[]> = { leader: [], niche: [], volume: [], laggard: [] };
    for (const d of data) bySeg[d.segment]?.push({ x: d.ws_percent, y: d.nd_percent, brand: d.brand_name });

    const series = Object.entries(bySeg)
      .filter(([, pts]) => pts.length)
      .map(([seg, pts]) => ({
        name: seg === 'leader' ? 'Leader' : seg === 'niche' ? 'Niche (vol. ↑ diffus ↓)' : seg === 'volume' ? 'Volume (diffus ↑ vol. ↓)' : 'Retardataire',
        data: pts.map(p => ({ x: p.x, y: p.y })),
      }));

    this.chartCorrelationOpts.set({
      series,
      chart:      { type: 'scatter', height: 380, toolbar: { show: false }, zoom: { enabled: true } },
      colors:     [segColors['leader'], segColors['niche'], segColors['volume'], segColors['laggard']],
      dataLabels: { enabled: false },
      markers:    { size: 8, hover: { size: 10 } },
      xaxis: { title: { text: 'WS %' }, min: 0, max: 100, labels: { formatter: (v: number) => `${v}%` } },
      yaxis: { title: { text: 'ND %' }, min: 0, max: 100, labels: { formatter: (v: number) => `${v}%` } },
      annotations: {
        xaxis: [{ x: threshold, borderColor: '#888', label: { text: `WS seuil ${threshold}%`, position: 'bottom' } }],
        yaxis: [{ y: threshold, borderColor: '#888', label: { text: `ND seuil ${threshold}%` } }],
      },
      legend:  { position: 'top' },
      tooltip: {
        shared: false, intersect: true,
        custom: ({ dataPointIndex, seriesIndex, w }: any) => {
          const pt = w.config.series[seriesIndex]?.data?.[dataPointIndex];
          if (!pt) return '';
          const match = data.find(d => Math.abs(d.ws_percent - pt.x) < 0.01 && Math.abs(d.nd_percent - pt.y) < 0.01);
          return `<div class="ws-tooltip-scatter">
            <strong>${match?.brand_name ?? ''}</strong><br/>
            WS: ${pt.x}% &nbsp;|&nbsp; ND: ${pt.y}%
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

  onThresholdChange(t: number): void {
    this.correlationThreshold.set(t);
    this.loadCorrelation();
  }

  setSection(section: WSSection): void {
    this.activeSection.set(section);
  }

  setPeriod(key: string): void {
    this.selectedPeriod.set(key);
    if (key === 'custom') {
      this._openPickerOnNextCheck = true;
      return;
    }
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

  getWsBadge(ws: number): string {
    if (ws >= 75) return 'badge bg-success';
    if (ws >= 40) return 'badge bg-warning text-dark';
    return 'badge bg-danger';
  }

  getWsProgressClass(ws: number): string {
    if (ws >= 75) return 'bg-success';
    if (ws >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  getZoneBadge(zone: string): string {
    if (zone === 'strong') return 'badge bg-success';
    if (zone === 'mid')    return 'badge bg-warning text-dark';
    return 'badge bg-danger';
  }

  getZoneLabel(zone: string): string {
    if (zone === 'strong') return 'Fort ≥ 66%';
    if (zone === 'mid')    return 'Moyen 33–66%';
    return 'Faible < 33%';
  }

  getGapBadge(gap: number): string {
    if (gap > 5)  return 'badge bg-success-subtle text-success';
    if (gap < -5) return 'badge bg-danger-subtle text-danger';
    return 'badge bg-secondary-subtle text-secondary';
  }

  getGapLabel(gap: number): string {
    const sign = gap > 0 ? '+' : '';
    if (gap > 5)  return `${sign}${gap.toFixed(1)}pp (Qualité)`;
    if (gap < -5) return `${gap.toFixed(1)}pp (Diffus)`;
    return `${sign}${gap.toFixed(1)}pp`;
  }

  getSegBadge(seg: string): string {
    const map: Record<string, string> = {
      leader:  'badge bg-success',
      niche:   'badge bg-info text-dark',
      volume:  'badge bg-warning text-dark',
      laggard: 'badge bg-danger',
    };
    return map[seg] ?? 'badge bg-secondary';
  }

  getSegLabel(seg: string): string {
    const map: Record<string, string> = {
      leader:  'Leader',
      niche:   'Niche',
      volume:  'Volume',
      laggard: 'Retardataire',
    };
    return map[seg] ?? seg;
  }

  getSegCount(seg: string): number {
    return this.correlationData().filter(d => d.segment === seg).length;
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

  getPeriodLabel(): string {
    return this.PERIODS.find(p => p.key === this.selectedPeriod())?.label ?? 'Période';
  }

  getTrendClass(value: number): string {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }
}
