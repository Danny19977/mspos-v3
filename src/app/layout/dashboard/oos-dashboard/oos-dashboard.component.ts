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
import { OosService } from '../services/oos.service';
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
  OOSSummaryKPIModel,
  OOSBrandRankModel,
  OOSAlertModel,
  OOSEvolutionRowModel,
  OOSHeatmapModel,
  OOSTrendSeries,
  OOSTableRowModel,
  OOSBarChartModel,
} from '../models/dashboard.models';

export type OOSSection =
  'kpi' | 'trend' | 'tableview' | 'barchart' | 'ranking' | 'alert' | 'evolution' | 'heatmap';
export type GeoLevel = 'province' | 'area' | 'subarea' | 'commune';

@Component({
  selector: 'app-oos-dashboard',
  standalone: false,
  templateUrl: './oos-dashboard.component.html',
  styleUrl: './oos-dashboard.component.scss',
})
export class OosDashboardComponent implements OnInit {

  // ── DI via inject() ────────────────────────────────────────────────────────
  private common          = inject(CommonService);
  private renderer        = inject(Renderer2);
  private fb              = inject(FormBuilder);
  private cdr             = inject(ChangeDetectorRef);
  private authService     = inject(AuthService);
  private oosService      = inject(OosService);
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
    { key: 'today', label: "Aujourd'hui" },
    { key: '1w',   label: '1 semaine'   },
    { key: '1m',   label: '1 mois'      },
    { key: '3m',   label: '3 mois'      },
    { key: '6m',   label: '6 mois'      },
    { key: '1y',   label: '1 an'        },
    { key: 'custom', label: 'Personnalisé' },
  ];

  // ── Geography — lists as signals ───────────────────────────────────────────
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

  // geo selections kept as plain optionals — bound via [(ngModel)] in template
  selectedCountry?:  ICountry;
  selectedProvince?: IProvince;
  selectedArea?:     IArea;
  selectedSubArea?:  ISubArea;
  selectedCommune?:  ICommune;

  // ── Geo / section level — signals ──────────────────────────────────────────
  activeSection  = signal<OOSSection>('trend');
  geoLevel       = signal<GeoLevel>('province');
  heatmapLevel   = signal<GeoLevel>('province');

  // ── Loading flags — signals ────────────────────────────────────────────────
  isLoadingKpi       = signal(false);
  isLoadingTrend     = signal(false);
  isLoadingTable     = signal(false);
  isLoadingBar       = signal(false);
  isLoadingRanking   = signal(false);
  isLoadingAlert     = signal(false);
  isLoadingEvolution = signal(false);
  isLoadingHeatmap   = signal(false);

  // ── Data — signals ─────────────────────────────────────────────────────────
  kpiData       = signal<OOSSummaryKPIModel | null>(null);
  trendData     = signal<OOSTrendSeries[]>([]);
  tableData     = signal<OOSTableRowModel[]>([]);
  barData       = signal<OOSBarChartModel>({ categories: [], series: [] });
  rankingData   = signal<OOSBrandRankModel[]>([]);
  alertData     = signal<OOSAlertModel[]>([]);
  evolutionData = signal<OOSEvolutionRowModel[]>([]);
  heatmapData   = signal<OOSHeatmapModel>({ brands: [], territories: [], matrix: [] });

  // ── Chart options — signals ────────────────────────────────────────────────
  chartTrendOpts     = signal<any>(null);
  chartBarOpts       = signal<any>(null);
  chartEvolutionOpts = signal<any>(null);
  chartHeatmapOpts   = signal<any>(null);
  chartRankingOpts   = signal<any>(null);
  chartAlertOpts     = signal<any>(null);

  // ── TableView computed grouping ────────────────────────────────────────────
  tableGrouped = computed<{ territory_name: string; territory_uuid: string; rows: OOSTableRowModel[] }[]>(() => {
    const map = new Map<string, OOSTableRowModel[]>();
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
  @ViewChild('chartTrend')     chartTrendRef!:     ChartComponent;
  @ViewChild('chartBar')       chartBarRef!:       ChartComponent;
  @ViewChild('chartEvolution') chartEvolutionRef!: ChartComponent;
  @ViewChild('chartHeatmap')   chartHeatmapRef!:   ChartComponent;
  @ViewChild('chartRanking')   chartRankingRef!:   ChartComponent;
  @ViewChild('chartAlert')     chartAlertRef!:     ChartComponent;

  readonly BRAND_COLORS = [
    '#ef476f','#f77f00','#fcbf49','#06d6a0','#4361ee',
    '#f72585','#7209b7','#118ab2','#3a0ca3','#4cc9f0',
    '#e63946','#2a9d8f','#e9c46a','#f4a261','#264653',
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
    this.loadAlert();
    this.loadEvolution();
    this.loadHeatmap();
  }

  loadKpi(): void {
    if (!this.country_uuid) return;
    this.isLoadingKpi.set(true);
    this.oosService.OosSummaryKPI(this.geoParams).subscribe({
      next: res => { this.kpiData.set(res.data); this.isLoadingKpi.set(false); },
      error: ()  => this.isLoadingKpi.set(false),
    });
  }

  loadTrend(): void {
    if (!this.country_uuid) return;
    this.isLoadingTrend.set(true);
    this.oosService.OosLineChartByMonth(this.geoParams).subscribe({
      next: res => {
        this.trendData.set(res.data?.series ?? []);
        this.buildTrendChart(res.data?.months ?? []);
        this.isLoadingTrend.set(false);
      },
      error: () => this.isLoadingTrend.set(false),
    });
  }

  loadTable(): void {
    if (!this.country_uuid) return;
    this.isLoadingTable.set(true);
    const call =
      this.geoLevel() === 'province' ? this.oosService.OosTableViewProvince(this.geoParams)
    : this.geoLevel() === 'area'      ? this.oosService.OosTableViewArea(this.geoParams)
    : this.geoLevel() === 'subarea'   ? this.oosService.OosTableViewSubArea(this.geoParams)
    :                                   this.oosService.OosTableViewCommune(this.geoParams);
    call.subscribe({
      next: res => { this.tableData.set(res.data ?? []); this.isLoadingTable.set(false); },
      error: ()  => this.isLoadingTable.set(false),
    });
  }

  loadBar(): void {
    if (!this.country_uuid) return;
    this.isLoadingBar.set(true);
    const call =
      this.geoLevel() === 'province' ? this.oosService.OosBarChartProvince(this.geoParams)
    : this.geoLevel() === 'area'      ? this.oosService.OosBarChartArea(this.geoParams)
    : this.geoLevel() === 'subarea'   ? this.oosService.OosBarChartSubArea(this.geoParams)
    :                                   this.oosService.OosBarChartCommune(this.geoParams);
    call.subscribe({
      next: res => {
        const payload: OOSBarChartModel = res.data ?? { categories: [], series: [] };
        this.barData.set(payload);
        this.buildBarChart(payload);
        this.isLoadingBar.set(false);
      },
      error: () => this.isLoadingBar.set(false),
    });
  }

  loadRanking(): void {
    if (!this.country_uuid) return;
    this.isLoadingRanking.set(true);
    this.oosService.OosBrandRanking(this.geoParams).subscribe({
      next: res => {
        this.rankingData.set(res.data ?? []);
        this.buildRankingChart();
        this.isLoadingRanking.set(false);
      },
      error: () => this.isLoadingRanking.set(false),
    });
  }

  loadAlert(): void {
    if (!this.country_uuid) return;
    this.isLoadingAlert.set(true);
    this.oosService.OosCriticalAlert(this.geoParams).subscribe({
      next: res => {
        this.alertData.set(res.data ?? []);
        this.buildAlertChart();
        this.isLoadingAlert.set(false);
      },
      error: () => this.isLoadingAlert.set(false),
    });
  }

  loadEvolution(): void {
    if (!this.country_uuid) return;
    this.isLoadingEvolution.set(true);
    this.oosService.OosEvolution(this.geoParams).subscribe({
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
    this.oosService.OosHeatmap(this.geoParams, this.heatmapLevel()).subscribe({
      next: res => {
        this.heatmapData.set(res.data ?? { brands: [], territories: [], matrix: [] });
        this.buildHeatmapChart();
        this.isLoadingHeatmap.set(false);
      },
      error: () => this.isLoadingHeatmap.set(false),
    });
  }

  // ── Chart builders ─────────────────────────────────────────────────────────
  buildTrendChart(months: string[]): void {
    const data = this.trendData();
    if (!data.length) { this.chartTrendOpts.set(null); return; }
    const series = data.map(s => ({
      name: s.brand_name,
      data: months.map(m => s.data.find(p => p.month === m)?.oos_percent ?? 0),
    }));
    this.chartTrendOpts.set({
      series,
      chart:      { type: 'line', height: 320, toolbar: { show: false } },
      colors:     this.BRAND_COLORS.slice(0, series.length),
      stroke:     { curve: 'smooth', width: 2.5 },
      markers:    { size: 4, hover: { size: 6 } },
      dataLabels: { enabled: false },
      xaxis:      { categories: months, labels: { rotate: -30 } },
      yaxis:      { title: { text: 'OOS %' }, labels: { formatter: (v: number) => `${v}%` }, min: 0, max: 100 },
      legend:     { position: 'top' },
      tooltip:    { shared: true, intersect: false, y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
      grid:       { strokeDashArray: 4 },
    });
  }

  buildBarChart(payload: OOSBarChartModel): void {
    if (!payload.categories.length || !payload.series.length) { this.chartBarOpts.set(null); return; }
    const series = payload.series.map(s => ({
      name: s.brand_name,
      data: payload.categories.map(cat =>
        s.data.find(p => p.territory_name === cat)?.oos_percent ?? 0
      ),
    }));
    this.chartBarOpts.set({
      series,
      chart:       { type: 'bar', height: 340, toolbar: { show: false } },
      colors:      this.BRAND_COLORS.slice(0, series.length),
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: payload.categories, labels: { rotate: -30 } },
      yaxis:       { title: { text: 'OOS %' }, min: 0, max: 100, labels: { formatter: (v: number) => `${v}%` } },
      legend:      { position: 'top' },
      tooltip:     { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildAlertChart(): void {
    const data = this.alertData();
    if (!data.length) { this.chartAlertOpts.set(null); return; }
    const top15 = data.slice(0, 15);
    const colorMap: Record<string, string> = {
      critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a',
    };
    this.chartAlertOpts.set({
      series: [{ name: 'OOS %', data: top15.map(d => d.oos_percent) }],
      chart:       { type: 'bar', height: 340, toolbar: { show: false } },
      colors:      top15.map(d => colorMap[d.severity] ?? '#ef476f'),
      plotOptions: {
        bar: { horizontal: true, distributed: true, barHeight: '65%', borderRadius: 4,
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: { enabled: true, offsetX: 4, style: { fontSize: '11px' }, formatter: (v: number) => `${v.toFixed(1)}%` },
      xaxis:   { categories: top15.map(d => `${d.brand_name} / ${d.territory_name}`), labels: { formatter: (v: number) => `${v}%` }, max: 100 },
      legend:  { show: false },
      tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    });
  }

  buildEvolutionChart(): void {
    const data = this.evolutionData();
    if (!data.length) { this.chartEvolutionOpts.set(null); return; }
    this.chartEvolutionOpts.set({
      series: [
        { name: 'OOS% Courant',   data: data.map(d => d.current_oos_percent),  type: 'bar' },
        { name: 'OOS% Précédent', data: data.map(d => d.previous_oos_percent), type: 'bar' },
        { name: 'Delta (pp)',     data: data.map(d => d.delta),                 type: 'line' },
      ],
      chart:       { height: 320, toolbar: { show: false } },
      colors:      ['#ef476f', '#fca5a5', '#f77f00'],
      stroke:      { width: [0, 0, 2.5], curve: 'smooth' },
      plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 3 } },
      dataLabels:  { enabled: false },
      xaxis:       { categories: data.map(d => d.brand_name), labels: { rotate: -30 } },
      yaxis: [
        { seriesName: 'OOS% Courant',   title: { text: 'OOS %' },
          labels: { formatter: (v: number) => `${v}%` } },
        { seriesName: 'OOS% Précédent', show: false },
        { seriesName: 'Delta (pp)',     opposite: true, title: { text: 'Δ pp' },
          labels: { formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}pp` } },
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
      series: [{ name: 'OOS %', data: top10.map(d => d.oos_percent) }],
      chart:       { type: 'bar', height: 300, toolbar: { show: false } },
      colors:      ['#ef476f'],
      plotOptions: {
        bar: { horizontal: true, barHeight: '65%', borderRadius: 4,
          dataLabels: { position: 'top' } },
      },
      dataLabels: {
        enabled: true, offsetX: 4,
        style: { fontSize: '11px' },
        formatter: (v: number) => `${v}%`,
      },
      xaxis:   { categories: top10.map(d => d.brand_name), labels: { formatter: (v: number) => `${v}%` }, max: 100 },
      legend:  { show: false },
      tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
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
        height: Math.max(220, brands.length * 44),
        toolbar: { show: false },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '10px' },
        formatter: (v: number) => v > 0 ? `${v}%` : '',
      },
      colors: ['#ef476f'],
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.7,
          radius: 3,
          enableShades: true,
          colorScale: {
            ranges: [
              { from: 0,  to: 0,   color: '#fff5f5', name: 'Absent'   },
              { from: 1,  to: 15,  color: '#fecaca', name: 'Faible'   },
              { from: 16, to: 30,  color: '#f87171', name: 'Moyen'    },
              { from: 31, to: 50,  color: '#ef4444', name: 'Élevé'    },
              { from: 51, to: 100, color: '#991b1b', name: 'Critique' },
            ],
          },
        },
      },
      legend:  { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v}%` } },
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

  setSection(section: OOSSection): void {
    this.activeSection.set(section);
  }

  setPeriod(key: string): void {
    this.selectedPeriod.set(key);
    if (key === 'custom') return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;
    let end: Date = new Date(today);
    switch (key) {
      case 'today':
        start = new Date(today);
        break;
      case '1w':
        start = new Date(today); start.setDate(today.getDate() - 7);
        break;
      case '1m':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case '3m':
        start = new Date(today); start.setMonth(today.getMonth() - 3);
        break;
      case '6m':
        start = new Date(today); start.setMonth(today.getMonth() - 6);
        break;
      case '1y':
        start = new Date(today); start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return;
    }
    this.start_date = formatDate(start, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(end,   'yyyy-MM-dd', 'en-US');
    this.loadAllSections();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getPeriodLabel(): string {
    return this.PERIODS.find(p => p.key === this.selectedPeriod())?.label ?? 'Période';
  }

  getTrendIcon(trend: string): string {
    if (trend === 'worsening') return 'ti ti-trending-up text-danger';
    if (trend === 'improving') return 'ti ti-trending-down text-success';
    return 'ti ti-minus text-warning';
  }

  getTrendClass(value: number): string {
    if (value > 0) return 'text-danger';    // higher delta = worse for OOS
    if (value < 0) return 'text-success';
    return 'text-muted';
  }

  getTrendBadge(trend: string): string {
    if (trend === 'worsening') return 'badge bg-danger';
    if (trend === 'improving') return 'badge bg-success';
    return 'badge bg-warning text-dark';
  }

  getSeverityBadge(severity: string): string {
    switch (severity) {
      case 'critical': return 'badge oos-severity-critical';
      case 'high':     return 'badge oos-severity-high';
      case 'medium':   return 'badge oos-severity-medium';
      default:         return 'badge oos-severity-low';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'oos-severity-critical';
      case 'high':     return 'oos-severity-high';
      case 'medium':   return 'oos-severity-medium';
      default:         return 'oos-severity-low';
    }
  }

  getOosBadge(oos: number): string {
    if (oos >= 50) return 'badge bg-danger';
    if (oos >= 30) return 'badge bg-warning text-dark';
    if (oos >= 15) return 'badge bg-orange text-white';
    return 'badge bg-success';
  }

  getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}
