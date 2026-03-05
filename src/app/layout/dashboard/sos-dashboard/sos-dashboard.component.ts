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
import { SosService } from '../services/sos.service';
import { CountryService } from '../../territories/country/country.service';
import { ProvinceService } from '../../territories/province/province.service';
import { AreaService } from '../../territories/areas/area.service';
import { SubareaService } from '../../territories/subarea/subarea.service';
import { CommuneService } from '../../territories/commune/commune.service';

import { IUser }     from '../../management/user/models/user.model';
import { ICountry }  from '../../territories/country/models/country.model';
import { IProvince } from '../../territories/province/models/province.model';
import { IArea }     from '../../territories/areas/models/area.model';
import { ISubArea }  from '../../territories/subarea/models/subarea.model';
import { ICommune }  from '../../territories/commune/models/commune.model';

import {
  SOSSummaryKPIModel,
  SOSBrandRankModel,
  SOSConcentrationRowModel,
  SOSEvolutionRowModel,
  SOSHeatmapModel,
  SOSTrendSeriesModel,
  SOSTableRowModel,
  SOSBarGroupModel,
  SOSGapRowModel,
  SOSPosDrillRowModel,
  SOSVsNDRowModel,
} from '../models/dashboard.models';

export type SOSSection =
  'kpi' | 'trend' | 'tableview' | 'barchart' |
  'ranking' | 'concentration' | 'heatmap' |
  'evolution' | 'gap' | 'drilldown' | 'vsnd';

export type GeoLevel = 'province' | 'area' | 'subarea' | 'commune';

@Component({
  selector: 'app-sos-dashboard',
  standalone: false,
  templateUrl: './sos-dashboard.component.html',
  styleUrl: './sos-dashboard.component.scss',
})
export class SosDashboardComponent implements OnInit {

  // ── DI via inject() ────────────────────────────────────────────────────────
  private common          = inject(CommonService);
  private renderer        = inject(Renderer2);
  private fb              = inject(FormBuilder);
  private cdr             = inject(ChangeDetectorRef);
  private authService     = inject(AuthService);
  private sosService      = inject(SosService);
  private countryService  = inject(CountryService);
  private provinceService = inject(ProvinceService);
  private areaService     = inject(AreaService);
  private subAreaService  = inject(SubareaService);
  private communeService  = inject(CommuneService);

  // ── Router helpers ─────────────────────────────────────────────────────────
  public routes = routes;
  base = ''; page = ''; last = '';

  // ── Auth ───────────────────────────────────────────────────────────────────
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

  // ── Geography — signals ────────────────────────────────────────────────────
  countryList  = signal<ICountry[]>([]);
  provinceList = signal<IProvince[]>([]);
  areaList     = signal<IArea[]>([]);
  subAreaList  = signal<ISubArea[]>([]);
  communeList  = signal<ICommune[]>([]);

  countrySearch     = signal('');
  filteredCountries = computed(() =>
    this.countryList().filter(c =>
      c.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );

  selectedCountry?:  ICountry;
  selectedProvince?: IProvince;
  selectedArea?:     IArea;
  selectedSubArea?:  ISubArea;
  selectedCommune?:  ICommune;

  // ── Navigation signals ─────────────────────────────────────────────────────
  activeSection      = signal<SOSSection>('kpi');
  geoLevel           = signal<GeoLevel>('province');
  heatmapLevel       = signal<GeoLevel>('province');
  concentrationLevel = signal<GeoLevel>('province');

  // ── Loading flags — signals ────────────────────────────────────────────────
  isLoadingKpi           = signal(false);
  isLoadingTrend         = signal(false);
  isLoadingTable         = signal(false);
  isLoadingBar           = signal(false);
  isLoadingRanking       = signal(false);
  isLoadingConcentration = signal(false);
  isLoadingHeatmap       = signal(false);
  isLoadingEvolution     = signal(false);
  isLoadingGap           = signal(false);
  isLoadingDrillDown     = signal(false);
  isLoadingVsND          = signal(false);

  // ── Data — signals ─────────────────────────────────────────────────────────
  kpiData           = signal<SOSSummaryKPIModel | null>(null);
  trendData         = signal<SOSTrendSeriesModel[]>([]);
  tableData         = signal<SOSTableRowModel[]>([]);
  barData           = signal<SOSBarGroupModel[]>([]);
  rankingData       = signal<SOSBrandRankModel[]>([]);
  concentrationData = signal<SOSConcentrationRowModel[]>([]);
  heatmapData       = signal<SOSHeatmapModel>({ brands: [], territories: [], matrix: [] });
  evolutionData     = signal<SOSEvolutionRowModel[]>([]);
  gapData           = signal<SOSGapRowModel[]>([]);
  drillDownData     = signal<SOSPosDrillRowModel[]>([]);
  vsNdData          = signal<SOSVsNDRowModel[]>([]);

  // Gap analysis custom target %, POS drill-down selected brand
  gapTarget      = signal<number | null>(null);
  drillBrandUuid = signal<string>('');
  drillBrandName = signal<string>('');

  // ── Chart options — signals ────────────────────────────────────────────────
  chartTrendOpts         = signal<any>(null);
  chartBarOpts           = signal<any>(null);
  chartEvolutionOpts     = signal<any>(null);
  chartHeatmapOpts       = signal<any>(null);
  chartRankingOpts       = signal<any>(null);
  chartConcentrationOpts = signal<any>(null);
  chartGapOpts           = signal<any>(null);
  chartVsNdOpts          = signal<any>(null);

  // ── TableView computed grouping ────────────────────────────────────────────
  tableGrouped = computed<{ territory_name: string; territory_uuid: string; rows: SOSTableRowModel[] }[]>(() => {
    const map = new Map<string, SOSTableRowModel[]>();
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

  // ── Chart ViewChilds ───────────────────────────────────────────────────────
  @ViewChild('chartTrend')         chartTrendRef!:         ChartComponent;
  @ViewChild('chartBar')           chartBarRef!:           ChartComponent;
  @ViewChild('chartEvolution')     chartEvolutionRef!:     ChartComponent;
  @ViewChild('chartHeatmap')       chartHeatmapRef!:       ChartComponent;
  @ViewChild('chartRanking')       chartRankingRef!:       ChartComponent;
  @ViewChild('chartConcentration') chartConcentrationRef!: ChartComponent;
  @ViewChild('chartGap')           chartGapRef!:           ChartComponent;
  @ViewChild('chartVsNd')          chartVsNdRef!:          ChartComponent;

  // ── Brand colour palette ───────────────────────────────────────────────────
  readonly BRAND_COLORS = [
    '#4361ee','#06d6a0','#f77f00','#fcbf49','#ef476f',
    '#7209b7','#118ab2','#3a0ca3','#4cc9f0','#f72585',
    '#2a9d8f','#e9c46a','#f4a261','#264653','#e63946',
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

  // ── Geo param getters ──────────────────────────────────────────────────────
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

  // ── Master loader ──────────────────────────────────────────────────────────
  loadAllSections(): void {
    this.loadKpi();
    this.loadTrend();
    this.loadTable();
    this.loadBar();
    this.loadRanking();
    this.loadConcentration();
    this.loadHeatmap();
    this.loadEvolution();
    this.loadGap();
    this.loadVsNd();
    if (this.drillBrandUuid()) this.loadDrillDown(this.drillBrandUuid());
  }

  // ── Section loaders ────────────────────────────────────────────────────────

  loadKpi(): void {
    if (!this.country_uuid) return;
    this.isLoadingKpi.set(true);
    this.sosService.SosSummaryKPI(this.geoParams).subscribe({
      next: res => { this.kpiData.set(res.data); this.isLoadingKpi.set(false); },
      error: ()  => this.isLoadingKpi.set(false),
    });
  }

  loadTrend(): void {
    if (!this.country_uuid) return;
    this.isLoadingTrend.set(true);
    this.sosService.SosLineChartByMonth(this.geoParams).subscribe({
      next: res => {
        const series: SOSTrendSeriesModel[] = res.data ?? [];
        this.trendData.set(series);
        this.buildTrendChart(series);
        this.isLoadingTrend.set(false);
      },
      error: () => this.isLoadingTrend.set(false),
    });
  }

  loadTable(): void {
    if (!this.country_uuid) return;
    this.isLoadingTable.set(true);
    const lvl = this.geoLevel();
    const call =
      lvl === 'province' ? this.sosService.SosTableViewProvince(this.geoParams)
    : lvl === 'area'     ? this.sosService.SosTableViewArea(this.geoParams)
    : lvl === 'subarea'  ? this.sosService.SosTableViewSubArea(this.geoParams)
    :                      this.sosService.SosTableViewCommune(this.geoParams);
    call.subscribe({
      next: res => { this.tableData.set(res.data ?? []); this.isLoadingTable.set(false); },
      error: ()  => this.isLoadingTable.set(false),
    });
  }

  loadBar(): void {
    if (!this.country_uuid) return;
    this.isLoadingBar.set(true);
    const lvl = this.geoLevel();
    const call =
      lvl === 'province' ? this.sosService.SosBarChartProvince(this.geoParams)
    : lvl === 'area'     ? this.sosService.SosBarChartArea(this.geoParams)
    : lvl === 'subarea'  ? this.sosService.SosBarChartSubArea(this.geoParams)
    :                      this.sosService.SosBarChartCommune(this.geoParams);
    call.subscribe({
      next: res => {
        const groups: SOSBarGroupModel[] = res.data ?? [];
        this.barData.set(groups);
        this.buildBarChart(groups);
        this.isLoadingBar.set(false);
      },
      error: () => this.isLoadingBar.set(false),
    });
  }

  loadRanking(): void {
    if (!this.country_uuid) return;
    this.isLoadingRanking.set(true);
    this.sosService.SosBrandRanking(this.geoParams).subscribe({
      next: res => {
        this.rankingData.set(res.data ?? []);
        this.buildRankingChart();
        this.isLoadingRanking.set(false);
      },
      error: () => this.isLoadingRanking.set(false),
    });
  }

  loadConcentration(): void {
    if (!this.country_uuid) return;
    this.isLoadingConcentration.set(true);
    this.sosService.SosConcentrationIndex(this.geoParams, this.concentrationLevel()).subscribe({
      next: res => {
        this.concentrationData.set(res.data ?? []);
        this.buildConcentrationChart();
        this.isLoadingConcentration.set(false);
      },
      error: () => this.isLoadingConcentration.set(false),
    });
  }

  loadHeatmap(): void {
    if (!this.country_uuid) return;
    this.isLoadingHeatmap.set(true);
    this.sosService.SosHeatmap(this.geoParams, this.heatmapLevel()).subscribe({
      next: res => {
        const raw = res.data ?? {};
        this.heatmapData.set({
          brands:      raw.brands      ?? [],
          territories: raw.territories ?? [],
          matrix:      raw.matrix      ?? [],
        });
        this.buildHeatmapChart();
        this.isLoadingHeatmap.set(false);
      },
      error: () => this.isLoadingHeatmap.set(false),
    });
  }

  loadEvolution(): void {
    if (!this.country_uuid) return;
    this.isLoadingEvolution.set(true);
    this.sosService.SosEvolution(this.geoParams).subscribe({
      next: res => {
        this.evolutionData.set(res.data ?? []);
        this.buildEvolutionChart();
        this.isLoadingEvolution.set(false);
      },
      error: () => this.isLoadingEvolution.set(false),
    });
  }

  loadGap(target?: number): void {
    if (!this.country_uuid) return;
    this.isLoadingGap.set(true);
    const t = target ?? this.gapTarget() ?? undefined;
    this.sosService.SosGapAnalysis(this.geoParams, t).subscribe({
      next: res => {
        this.gapData.set(res.data ?? []);
        this.buildGapChart();
        this.isLoadingGap.set(false);
      },
      error: () => this.isLoadingGap.set(false),
    });
  }

  loadDrillDown(brandUuid: string): void {
    if (!this.country_uuid || !brandUuid) return;
    this.drillBrandUuid.set(brandUuid);
    this.isLoadingDrillDown.set(true);
    this.sosService.SosPosDrillDown(this.geoParams, brandUuid).subscribe({
      next: res => { this.drillDownData.set(res.data ?? []); this.isLoadingDrillDown.set(false); },
      error: ()  => this.isLoadingDrillDown.set(false),
    });
  }

  loadVsNd(): void {
    if (!this.country_uuid) return;
    this.isLoadingVsND.set(true);
    this.sosService.SosVsNDCorrelation(this.geoParams).subscribe({
      next: res => {
        this.vsNdData.set(res.data ?? []);
        this.buildVsNdChart();
        this.isLoadingVsND.set(false);
      },
      error: () => this.isLoadingVsND.set(false),
    });
  }

  // ── Chart builders ─────────────────────────────────────────────────────────

  buildTrendChart(series: SOSTrendSeriesModel[]): void {
    if (!series.length) { this.chartTrendOpts.set(null); return; }
    const monthSet = new Set<string>();
    series.forEach(s => s.data.forEach(p => monthSet.add(p.month)));
    const months = [...monthSet].sort();
    const apexSeries = series.map(s => ({
      name: s.brand_name,
      data: months.map(m => s.data.find(p => p.month === m)?.sos_percent ?? 0),
    }));
    this.chartTrendOpts.set({
      series: apexSeries,
      chart:      { type: 'line', height: 340, toolbar: { show: false } },
      colors:     this.BRAND_COLORS.slice(0, apexSeries.length),
      stroke:     { curve: 'smooth', width: 2.5 },
      markers:    { size: 4, hover: { size: 6 } },
      dataLabels: { enabled: false },
      xaxis:      { categories: months, labels: { rotate: -30 } },
      yaxis:      { title: { text: 'SOS %' }, labels: { formatter: (v: number) => `${v}%` }, min: 0, max: 100 },
      legend:     { position: 'top' },
      tooltip:    { shared: true, intersect: false, y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
      grid:       { strokeDashArray: 4 },
    });
  }

  buildBarChart(groups: SOSBarGroupModel[]): void {
    if (!groups.length) { this.chartBarOpts.set(null); return; }
    const categories  = groups.map(g => g.territory_name);
    const brandNames  = [...new Set(groups.flatMap(g => g.brands.map(b => b.brand_name)))];
    const apexSeries  = brandNames.map(brand => ({
      name: brand,
      data: groups.map(g => g.brands.find(x => x.brand_name === brand)?.sos_percent ?? 0),
    }));
    this.chartBarOpts.set({
      series: apexSeries,
      chart:       { type: 'bar', height: 340, toolbar: { show: false } },
      colors:      this.BRAND_COLORS.slice(0, apexSeries.length),
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories, labels: { rotate: -30 } },
      yaxis:       { title: { text: 'SOS %' }, min: 0, max: 100, labels: { formatter: (v: number) => `${v}%` } },
      legend:      { position: 'top' },
      tooltip:     { shared: true, intersect: false, y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildRankingChart(): void {
    const data = this.rankingData();
    if (!data.length) { this.chartRankingOpts.set(null); return; }
    const top10 = data.slice(0, 10);
    const dominanceColor = (d: string) =>
      d === 'leader' ? '#06d6a0' : d === 'challenger' ? '#f77f00' : '#4361ee';
    this.chartRankingOpts.set({
      series:      [{ name: 'SOS %', data: top10.map(d => d.sos_percent) }],
      chart:       { type: 'bar', height: 300, toolbar: { show: false } },
      colors:      top10.map(d => dominanceColor(d.dominance)),
      plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '65%', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels:  { enabled: true, offsetX: 4, style: { fontSize: '11px' }, formatter: (v: number) => `${v}%` },
      xaxis:       { categories: top10.map(d => d.brand_name), labels: { formatter: (v: number) => `${v}%` }, max: 100 },
      legend:      { show: false },
      tooltip:     { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildConcentrationChart(): void {
    const data = this.concentrationData();
    if (!data.length) { this.chartConcentrationOpts.set(null); return; }
    const structureColor = (s: string) =>
      s === 'concentrated' ? '#ef476f' : s === 'moderate' ? '#f77f00' : '#06d6a0';
    this.chartConcentrationOpts.set({
      series:      [{ name: 'HHI Index', data: data.map(d => d.hhi_index) }],
      chart:       { type: 'bar', height: Math.max(260, data.length * 36), toolbar: { show: false } },
      colors:      data.map(d => structureColor(d.market_structure)),
      plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '60%', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels:  { enabled: true, offsetX: 4, style: { fontSize: '11px' }, formatter: (v: number) => v.toFixed(0) },
      xaxis:       { categories: data.map(d => d.territory_name), max: 10000 },
      annotations: {
        xaxis: [
          { x: 1500, borderColor: '#f77f00', label: { text: 'Modéré (1 500)', style: { color: '#f77f00' } } },
          { x: 2500, borderColor: '#ef476f', label: { text: 'Concentré (2 500)', style: { color: '#ef476f' } } },
        ],
      },
      legend:  { show: false },
      tooltip: { y: { formatter: (v: number) => `HHI: ${v.toFixed(0)}` } },
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
      chart:      { type: 'heatmap', height: Math.max(240, brands.length * 42), toolbar: { show: false } },
      dataLabels: { enabled: true, style: { fontSize: '10px' }, formatter: (v: number) => v > 0 ? `${v}%` : '' },
      colors:     ['#4361ee'],
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.75, radius: 3, enableShades: true,
          colorScale: {
            ranges: [
              { from: 0,  to: 0,   color: '#f8faff', name: 'Absent'   },
              { from: 1,  to: 15,  color: '#bfdbfe', name: 'Faible'   },
              { from: 16, to: 30,  color: '#60a5fa', name: 'Moyen'    },
              { from: 31, to: 50,  color: '#2563eb', name: 'Élevé'    },
              { from: 51, to: 100, color: '#1e3a8a', name: 'Dominant' },
            ],
          },
        },
      },
      legend:  { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v}%` } },
    });
  }

  buildEvolutionChart(): void {
    const data = this.evolutionData();
    if (!data.length) { this.chartEvolutionOpts.set(null); return; }
    this.chartEvolutionOpts.set({
      series: [
        { name: 'SOS% Courant',   data: data.map(d => d.current_sos_percent),  type: 'bar' },
        { name: 'SOS% Précédent', data: data.map(d => d.previous_sos_percent), type: 'bar' },
        { name: 'Delta (pp)',     data: data.map(d => d.delta),                 type: 'line' },
      ],
      chart:       { height: 340, toolbar: { show: false } },
      colors:      ['#4361ee', '#a5b4fc', '#f77f00'],
      stroke:      { width: [0, 0, 2.5], curve: 'smooth' },
      plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: data.map(d => d.brand_name), labels: { rotate: -30 } },
      yaxis: [
        { seriesName: 'SOS% Courant',   title: { text: 'SOS %' }, labels: { formatter: (v: number) => `${v}%` }, min: 0, max: 100 },
        { seriesName: 'SOS% Précédent', show: false },
        { seriesName: 'Delta (pp)',     opposite: true, title: { text: 'Δ pp' }, labels: { formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}pp` } },
      ],
      legend:  { position: 'top' },
      tooltip: { shared: true, intersect: false },
    });
  }

  buildGapChart(): void {
    const data = this.gapData();
    if (!data.length) { this.chartGapOpts.set(null); return; }
    this.chartGapOpts.set({
      series: [
        { name: 'SOS % réel',  data: data.map(d => d.sos_percent) },
        { name: 'Écart cible', data: data.map(d => Math.max(0, d.gap)) },
      ],
      chart:       { type: 'bar', height: 320, stacked: true, toolbar: { show: false } },
      colors:      ['#4361ee', '#fca5a5'],
      plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: data.map(d => d.brand_name), max: 100, labels: { formatter: (v: number) => `${v}%` } },
      legend:      { position: 'top' },
      tooltip:     { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildVsNdChart(): void {
    const data = this.vsNdData();
    if (!data.length) { this.chartVsNdOpts.set(null); return; }
    const posColor = (p: string) => ({
      'leader': '#06d6a0', 'present_not_dominant': '#f77f00',
      'stocked_not_distributed': '#4361ee', 'niche': '#9ca3af',
    }[p] ?? '#9ca3af');
    const series = data.map(d => ({ name: d.brand_name, data: [{ x: d.nd_percent, y: d.sos_percent, z: d.brand_fardes }] }));
    this.chartVsNdOpts.set({
      series,
      chart:      { type: 'bubble', height: 400, toolbar: { show: false } },
      colors:     data.map(d => posColor(d.position)),
      dataLabels: { enabled: true, formatter: (_v: any, opts: any) => data[opts.seriesIndex]?.brand_name },
      xaxis:      { title: { text: 'ND %' }, min: 0, max: 100, labels: { formatter: (v: number) => `${v}%` } },
      yaxis:      { title: { text: 'SOS %' }, min: 0, max: 100, labels: { formatter: (v: number) => `${v}%` } },
      legend:     { show: false },
      tooltip: {
        custom: ({ seriesIndex }: any) => {
          const d = data[seriesIndex];
          return `<div class="p-2 small"><b>${d.brand_name}</b><br>ND: ${d.nd_percent}% | SOS: ${d.sos_percent}%<br>Position: <b>${d.position.replace(/_/g, ' ')}</b></div>`;
        },
      },
      annotations: {
        xaxis: [{ x: 50, borderDash: 4, borderColor: '#9ca3af', label: { text: 'ND 50%' } }],
        yaxis: [{ y: 33, borderDash: 4, borderColor: '#9ca3af', label: { text: 'SOS 33%' } }],
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
    this.provinceList.set([]); this.areaList.set([]); this.subAreaList.set([]); this.communeList.set([]);
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
    this.areaList.set([]); this.subAreaList.set([]); this.communeList.set([]);
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
    this.subAreaList.set([]); this.communeList.set([]);
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

  onConcentrationLevelChange(level: GeoLevel): void {
    this.concentrationLevel.set(level);
    this.loadConcentration();
  }

  setSection(section: SOSSection): void { this.activeSection.set(section); }

  selectDrillBrand(brandUuid: string, brandName: string): void {
    this.drillBrandName.set(brandName);
    this.setSection('drilldown');
    this.loadDrillDown(brandUuid);
  }

  applyGapTarget(target: number | null): void {
    this.gapTarget.set(target);
    this.loadGap(target ?? undefined);
  }

  // ── Period selector ────────────────────────────────────────────────────────
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
        end   = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
      case '3m':  start = new Date(today); start.setMonth(today.getMonth() - 3); break;
      case '6m':  start = new Date(today); start.setMonth(today.getMonth() - 6); break;
      case '1y':  start = new Date(today); start.setFullYear(today.getFullYear() - 1); break;
      default: return;
    }
    this.start_date = formatDate(start, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(end,   'yyyy-MM-dd', 'en-US');
    this.loadAllSections();
  }

  // ── Display helpers ────────────────────────────────────────────────────────
  getPeriodLabel(): string {
    return this.PERIODS.find(p => p.key === this.selectedPeriod())?.label ?? 'Période';
  }

  getMarketStructureBadge(s: string): string {
    return s === 'concentrated' ? 'badge bg-danger'
         : s === 'moderate'     ? 'badge bg-warning text-dark'
         :                        'badge bg-success';
  }

  getDominanceBadge(d: string): string {
    return d === 'leader'     ? 'badge bg-success'
         : d === 'challenger' ? 'badge bg-warning text-dark'
         :                      'badge bg-secondary';
  }

  getTrendBadge(trend: string): string {
    return trend === 'gaining' ? 'badge bg-success'
         : trend === 'losing'  ? 'badge bg-danger'
         :                       'badge bg-warning text-dark';
  }

  getTrendIcon(trend: string): string {
    return trend === 'gaining' ? 'ti ti-trending-up text-success'
         : trend === 'losing'  ? 'ti ti-trending-down text-danger'
         :                       'ti ti-minus text-warning';
  }

  getDeltaClass(delta: number): string {
    if (delta > 0) return 'text-success';
    if (delta < 0) return 'text-danger';
    return 'text-muted';
  }

  getStatusBadge(status: string): string {
    return status === 'above_target' ? 'badge bg-success' : 'badge bg-danger';
  }

  getPositionBadge(position: string): string {
    switch (position) {
      case 'leader':                  return 'badge bg-success';
      case 'present_not_dominant':    return 'badge bg-warning text-dark';
      case 'stocked_not_distributed': return 'badge bg-info text-dark';
      default:                        return 'badge bg-secondary';
    }
  }

  getPositionLabel(position: string): string {
    switch (position) {
      case 'leader':                  return 'Leader';
      case 'present_not_dominant':    return 'Présent / non dominant';
      case 'stocked_not_distributed': return 'Stocké / non distribué';
      default:                        return 'Niche';
    }
  }

  getSosBadge(sos: number): string {
    if (sos >= 50) return 'badge bg-success';
    if (sos >= 30) return 'badge bg-info text-dark';
    if (sos >= 15) return 'badge bg-warning text-dark';
    return 'badge bg-secondary';
  }

  getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}
