import {
  AfterViewChecked,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, computed, OnInit, Renderer2, signal, ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexXAxis,
  ApexPlotOptions, ApexYAxis, ApexTooltip, ApexLegend, ApexFill,
  ApexStroke, ChartComponent,
} from 'ng-apexcharts';
import { BsDaterangepickerDirective } from 'ngx-bootstrap/datepicker';

import { routes } from '../../../shared/routes/routes';
import { CommonService } from '../../../shared/common/common.service';
import { AuthService } from '../../../auth/auth.service';
import { SaleEvolutionService } from '../services/sale-evolution.service';
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
  SEKpiSummary, SEMonthlyEvolutionModel, SEGrowthRateModel,
  SEBrandCompetitionModel, SETopPOSModel, SESalesRepModel, SEDayHeatmapModel,
} from '../models/dashboard.models';

export type GeoLevel = 'province' | 'area' | 'subarea' | 'commune';
export type DashSection = 'overview' | 'tableview' | 'growth' | 'competition' | 'toppos' | 'scorecard' | 'heatmap';

@Component({
  selector: 'app-se-dashboard',
  standalone: false,
  templateUrl: './se-dashboard.component.html',
  styleUrl: './se-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SeDashboardComponent implements OnInit, AfterViewChecked {
  public routes = routes;
  base = ''; page = ''; last = '';

  // ── Auth ────────────────────────────────────────────────────────────────────
  currentUser!: IUser;
  isLoading = false;

  // ── Date range ──────────────────────────────────────────────────────────────
  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;
  rangeDate: any[] = [];
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

  private _openPickerOnNextCheck = false;
  @ViewChild('dateRangeInput') dateRangePicker?: BsDaterangepickerDirective;
  // ── Geography ───────────────────────────────────────────────────────────────
  countryList  = signal<ICountry[]>([]);
  provinceList = signal<IProvince[]>([]);
  areaList     = signal<IArea[]>([]);
  subAreaList  = signal<ISubArea[]>([]);
  communeList  = signal<ICommune[]>([]);

  countrySearch   = signal('');
  filteredCountries = computed(() =>
    this.countryList().filter(c => c.name.toLowerCase().includes(this.countrySearch().toLowerCase()))
  );

  selectedCountry!:  ICountry;
  selectedProvince!: IProvince;
  selectedArea!:     IArea;
  selectedSubArea!:  ISubArea;
  selectedCommune!:  ICommune;

  geoLevel: GeoLevel = 'province';

  // ── Active dashboard section ─────────────────────────────────────────────
  activeSection: DashSection = 'overview';

  // ── Loading flags ────────────────────────────────────────────────────────
  isLoadingKpi         = false;
  isLoadingEvolution   = false;
  isLoadingGrowth      = false;
  isLoadingCompetition = false;
  isLoadingTopPos      = false;
  isLoadingScorecard   = false;
  isLoadingHeatmap     = false;

  // ── Data ─────────────────────────────────────────────────────────────────
  kpiData!: SEKpiSummary;
  evolutionData:   SEMonthlyEvolutionModel[]   = [];
  growthData:      SEGrowthRateModel[]         = [];
  competitionData: SEBrandCompetitionModel[]   = [];
  topPosData:      SETopPOSModel[]             = [];
  scorecardData:   SESalesRepModel[]           = [];
  heatmapData:     SEDayHeatmapModel[]         = [];

  // Title filter for scorecard
  titleFilter = '';
  titleOptions = ['', 'ASM', 'Supervisor', 'DR', 'Cyclo'];

  // ── Charts ───────────────────────────────────────────────────────────────
  @ViewChild('chartEvolution')   chartEvolution!:   ChartComponent;
  @ViewChild('chartGrowth')      chartGrowth!:      ChartComponent;
  @ViewChild('chartCompetition') chartCompetition!: ChartComponent;
  @ViewChild('chartHeatmap')     chartHeatmap!:     ChartComponent;
  @ViewChild('chartTopPos')      chartTopPos!:      ChartComponent;

  chartEvolutionOpts:   any;
  chartGrowthOpts:      any;
  chartCompetitionOpts: any;
  chartHeatmapOpts:     any;
  chartTopPosOpts:      any;

  readonly BRAND_COLORS = [
    '#4361ee','#3a0ca3','#7209b7','#f72585','#4cc9f0',
    '#06d6a0','#ffd166','#ef476f','#118ab2','#ff9f1c',
    '#e63946','#2a9d8f','#e9c46a','#f4a261','#264653',
  ];

  constructor(
    private common:          CommonService,
    private renderer:        Renderer2,
    private fb:              FormBuilder,
    private cdr:             ChangeDetectorRef,
    private authService:     AuthService,
    private seService:       SaleEvolutionService,
    private countryService:  CountryService,
    private provinceService: ProvinceService,
    private areaService:     AreaService,
    private subAreaService:  SubareaService,
    private communeService:  CommuneService,
  ) {
    this.common.base.subscribe(b => this.base = b);
    this.common.page.subscribe(p => this.page = p);
    this.common.last.subscribe(l => this.last = l);
  }

  ngAfterViewChecked(): void {
    if (this._openPickerOnNextCheck && this.dateRangePicker) {
      this._openPickerOnNextCheck = false;
      this.dateRangePicker.show();
    }
  }

  ngOnInit(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this.fb.group({ rangeValue: new FormControl(this.rangeDate) });
    this.start_date = formatDate(firstDay, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(lastDay,  'yyyy-MM-dd', 'en-US');

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.countryService.getAll().subscribe(res => {
          this.countryList.set(res.data);
          const defaultCountry = (this.currentUser.role !== 'Managers' && this.currentUser.role !== 'Support')
            ? res.data[0]
            : res.data.find((c: ICountry) => c.uuid === this.currentUser.country_uuid) ?? res.data[0];
          this.selectedCountry = defaultCountry;

          this.provinceService.getAll().subscribe(pr => {
            this.provinceList.set(pr.data);
            const defaultProvince = (this.currentUser.role !== 'Managers' && this.currentUser.role !== 'Support')
              ? pr.data[0]
              : pr.data.find((p: IProvince) => p.uuid === this.currentUser.province_uuid) ?? pr.data[0];
            this.selectedProvince = defaultProvince;
            this.loadAll();
          });
        });
      },
    });

    this.dateRange.valueChanges.subscribe(val => {
      if (this.selectedPeriod() !== 'custom') return;
      if (val.rangeValue?.[0] && val.rangeValue?.[1]) {
        this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');
        const end = new Date(val.rangeValue[1]);
        end.setDate(end.getDate() + 1);
        this.end_date = formatDate(end, 'yyyy-MM-dd', 'en-US');
        this.loadAll();
      }
    });
  }

  // ── Geo shortcuts ──────────────────────────────────────────────────────────
  get country_uuid()  { return this.selectedCountry?.uuid  ?? ''; }
  get province_uuid() { return this.selectedProvince?.uuid ?? ''; }
  get area_uuid()     { return this.selectedArea?.uuid     ?? ''; }
  get sub_area_uuid() { return this.selectedSubArea?.uuid  ?? ''; }
  get commune_uuid()  { return this.selectedCommune?.uuid  ?? ''; }

  // ── Period selector ────────────────────────────────────────────────────────
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
    this.loadAll();
  }

  getPeriodLabel(): string {
    return this.PERIODS.find(p => p.key === this.selectedPeriod())?.label ?? 'Période';
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  loadAll(): void {
    this.loadKpi();
    this.loadEvolution();
    this.loadGrowth();
    this.loadCompetition();
    this.loadTopPos();
    this.loadScorecard();
    this.loadHeatmap();
  }

  loadKpi(): void {
    if (!this.country_uuid) return;
    this.isLoadingKpi = true;
    this.seService.SalesSummaryKPI(
      this.country_uuid, this.start_date, this.end_date,
      this.province_uuid, this.area_uuid, this.sub_area_uuid, this.commune_uuid,
    ).subscribe({
      next: res => { this.kpiData = res.data; this.isLoadingKpi = false; },
      error: ()  => { this.isLoadingKpi = false; },
    });
  }

  loadEvolution(): void {
    if (!this.country_uuid) return;
    this.isLoadingEvolution = true;
    this.seService.SalesEvolutionByMonth(
      this.country_uuid, this.start_date, this.end_date,
      this.province_uuid, this.area_uuid, this.sub_area_uuid, this.commune_uuid,
    ).subscribe({
      next: res => {
        this.evolutionData = res.data ?? [];
        this.buildEvolutionChart();
        this.isLoadingEvolution = false;
      },
      error: () => { this.isLoadingEvolution = false; },
    });
  }

  loadGrowth(): void {
    if (!this.country_uuid) return;
    this.isLoadingGrowth = true;
    const d1 = new Date(this.start_date);
    const d2 = new Date(this.end_date);
    const days = Math.round((d2.getTime() - d1.getTime()) / 86400000);
    const prevEnd   = new Date(d1); prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - days);

    this.seService.SalesGrowthRate(
      this.country_uuid,
      this.start_date, this.end_date,
      formatDate(prevStart, 'yyyy-MM-dd', 'en-US'),
      formatDate(prevEnd,   'yyyy-MM-dd', 'en-US'),
      this.province_uuid, this.area_uuid, this.sub_area_uuid, this.commune_uuid,
    ).subscribe({
      next: res => {
        this.growthData = res.data ?? [];
        this.buildGrowthChart();
        this.isLoadingGrowth = false;
      },
      error: () => { this.isLoadingGrowth = false; },
    });
  }

  loadCompetition(): void {
    if (!this.country_uuid || !this.province_uuid) return;
    this.isLoadingCompetition = true;
    this.seService.BrandCompetitionMatrix(
      this.country_uuid, this.province_uuid, this.start_date, this.end_date,
      this.geoLevel, this.area_uuid, this.sub_area_uuid, this.commune_uuid,
    ).subscribe({
      next: res => {
        this.competitionData = res.data ?? [];
        this.buildCompetitionChart();
        this.isLoadingCompetition = false;
      },
      error: () => { this.isLoadingCompetition = false; },
    });
  }

  loadTopPos(): void {
    if (!this.country_uuid) return;
    this.isLoadingTopPos = true;
    this.seService.TopPOSRanking(
      this.country_uuid, this.start_date, this.end_date,
      this.province_uuid, this.area_uuid, this.sub_area_uuid, this.commune_uuid,
    ).subscribe({
      next: res => {
        this.topPosData = res.data ?? [];
        this.buildTopPosChart();
        this.isLoadingTopPos = false;
      },
      error: () => { this.isLoadingTopPos = false; },
    });
  }

  loadScorecard(): void {
    if (!this.country_uuid) return;
    this.isLoadingScorecard = true;
    this.seService.SalesRepScorecard(
      this.country_uuid, this.start_date, this.end_date,
      this.province_uuid, this.area_uuid, this.sub_area_uuid, this.commune_uuid, this.titleFilter,
    ).subscribe({
      next: res => { this.scorecardData = res.data ?? []; this.isLoadingScorecard = false; },
      error: () => { this.isLoadingScorecard = false; },
    });
  }

  loadHeatmap(): void {
    if (!this.country_uuid) return;
    this.isLoadingHeatmap = true;
    this.seService.SalesHeatmapByDayOfWeek(
      this.country_uuid, this.start_date, this.end_date,
      this.province_uuid, this.area_uuid, this.sub_area_uuid, this.commune_uuid,
    ).subscribe({
      next: res => {
        this.heatmapData = res.data ?? [];
        this.buildHeatmapChart();
        this.isLoadingHeatmap = false;
      },
      error: () => { this.isLoadingHeatmap = false; },
    });
  }

  // ── Chart builders ─────────────────────────────────────────────────────────

  buildEvolutionChart(): void {
    const brands = [...new Set(this.evolutionData.map(d => d.brand_name))];
    const months = [...new Set(this.evolutionData.map(d => d.year_month))].sort();
    const series = brands.map(b => ({
      name: b,
      data: months.map(m => this.evolutionData.find(d => d.brand_name === b && d.year_month === m)?.total_farde ?? 0),
    }));
    this.chartEvolutionOpts = {
      series,
      chart: { type: 'area', height: 300, toolbar: { show: false } },
      colors: this.BRAND_COLORS.slice(0, brands.length),
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
      xaxis: { categories: months, labels: { rotate: -30 } },
      yaxis: { title: { text: 'Farde' } },
      legend: { position: 'top' },
      tooltip: { shared: true, intersect: false },
    };
  }

  buildGrowthChart(): void {
    this.chartGrowthOpts = {
      series: [
        { name: 'Croissance Farde %', data: this.growthData.map(d => d.growth_farde_pct) },
        { name: 'Croissance Sold %',  data: this.growthData.map(d => d.growth_sold_pct)  },
        { name: 'Croissance Rev. %',  data: this.growthData.map(d => d.growth_revenue_pct) },
      ],
      chart: { type: 'bar', height: 300, toolbar: { show: false } },
      colors: ['#4361ee', '#f72585', '#06d6a0'],
      plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: { categories: this.growthData.map(d => d.brand_name), labels: { rotate: -30 } },
      yaxis: { title: { text: '%' }, labels: { formatter: (v: number) => `${v}%` } },
      legend: { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    };
  }

  buildCompetitionChart(): void {
    const geos   = [...new Set(this.competitionData.map(d => d.geo_name))];
    const brands = [...new Set(this.competitionData.map(d => d.brand_name))];
    const series = brands.map(b => ({
      name: b,
      data: geos.map(g => this.competitionData.find(d => d.geo_name === g && d.brand_name === b)?.market_share ?? 0),
    }));
    this.chartCompetitionOpts = {
      series,
      chart: { type: 'bar', height: 320, stacked: true, toolbar: { show: false } },
      colors: this.BRAND_COLORS.slice(0, brands.length),
      plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      xaxis: { categories: geos, labels: { rotate: -30 } },
      yaxis: { max: 100, title: { text: 'Part de marché (%)' }, labels: { formatter: (v: number) => `${v}%` } },
      legend: { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v}%` } },
    };
  }

  buildHeatmapChart(): void {
    const brands = [...new Set(this.heatmapData.map(d => d.brand_name))];
    const days   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const series = brands.map(b => ({
      name: b,
      data: [1,2,3,4,5,6,7].map(dow => {
        const row = this.heatmapData.find(d => d.brand_name === b && d.day_of_week === dow);
        return { x: days[dow - 1], y: row?.total_farde ?? 0 };
      }),
    }));
    this.chartHeatmapOpts = {
      series,
      chart: { type: 'heatmap', height: 280, toolbar: { show: false } },
      dataLabels: { enabled: false },
      colors: ['#4361ee'],
      legend: { position: 'top' },
      tooltip: { y: { formatter: (v: number) => `${v} fardes` } },
      plotOptions: { heatmap: { shadeIntensity: 0.7, radius: 4, enableShades: true,
        colorScale: { ranges: [
          { from: 0,    to: 0,    color: '#f1f3ff', name: 'Aucun' },
          { from: 1,    to: 100,  color: '#aab7f8', name: 'Faible' },
          { from: 101,  to: 500,  color: '#4361ee', name: 'Moyen' },
          { from: 501,  to: 99999,color: '#1d3086', name: 'Élevé' },
        ]} } },
    };
  }

  buildTopPosChart(): void {
    const top8 = this.topPosData.slice(0, 8);
    this.chartTopPosOpts = {
      series: [{ name: 'Farde', data: top8.map(d => d.total_farde) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      colors: ['#4361ee'],
      plotOptions: { bar: { horizontal: true, barHeight: '65%', borderRadius: 4 } },
      dataLabels: { enabled: true, offsetX: -6, style: { fontSize: '11px', colors: ['#fff'] } },
      xaxis: { categories: top8.map(d => d.pos_name.length > 18 ? d.pos_name.slice(0, 18) + '…' : d.pos_name) },
      legend: { show: false },
      tooltip: { y: { formatter: (v: number) => `${v} fardes` } },
    };
  }

  // ── Geo event handlers ─────────────────────────────────────────────────────

  onCountryChange(country: ICountry): void {
    this.selectedCountry  = country;
    this.selectedProvince = null!;
    this.selectedArea     = null!;
    this.selectedSubArea  = null!;
    this.selectedCommune  = null!;
    if (country) {
      this.provinceService.getAll().subscribe(res => {
        this.provinceList.set(res.data.filter((p: IProvince) => p.country_uuid === country.uuid));
      });
    } else {
      this.provinceList.set([]);
    }
    this.loadAll();
  }

  onProvinceChange(province: IProvince): void {
    this.selectedProvince = province;
    this.selectedArea     = null!;
    this.selectedSubArea  = null!;
    this.selectedCommune  = null!;
    if (province) {
      this.areaService.getAll().subscribe(res => {
        this.areaList.set(res.data.filter((a: IArea) => a.province_uuid === province.uuid));
      });
    } else {
      this.areaList.set([]);
    }
    this.loadAll();
  }

  onAreaChange(area: IArea): void {
    this.selectedArea    = area;
    this.selectedSubArea = null!;
    this.selectedCommune = null!;
    if (area) {
      this.subAreaService.getAll().subscribe(res => {
        this.subAreaList.set(res.data.filter((s: ISubArea) => s.area_uuid === area.uuid));
      });
    } else {
      this.subAreaList.set([]);
    }
    this.loadAll();
  }

  onSubAreaChange(subArea: ISubArea): void {
    this.selectedSubArea = subArea;
    this.selectedCommune = null!;
    if (subArea) {
      this.communeService.getAll().subscribe(res => {
        this.communeList.set(res.data.filter((c: ICommune) => c.sub_area_uuid === subArea.uuid));
      });
    } else {
      this.communeList.set([]);
    }
    this.loadAll();
  }

  onCommuneChange(commune: ICommune): void {
    this.selectedCommune = commune;
    this.loadAll();
  }

  onTitleFilterChange(title: string): void {
    this.titleFilter = title;
    this.loadScorecard();
  }

  updateCountrySearch(event: Event): void {
    this.countrySearch.set((event.target as HTMLInputElement).value);
  }

  setSection(section: DashSection): void {
    this.activeSection = section;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getTrendIcon(trend: string): string {
    if (trend === 'UP')   return 'ti ti-trending-up text-success';
    if (trend === 'DOWN') return 'ti ti-trending-down text-danger';
    return 'ti ti-minus text-warning';
  }

  getTrendClass(value: number): string {
    if (value > 0)  return 'text-success';
    if (value < 0)  return 'text-danger';
    return 'text-warning';
  }

  getPerfBadge(score: number): string {
    if (score >= 80) return 'badge bg-success';
    if (score >= 50) return 'badge bg-warning text-dark';
    return 'badge bg-danger';
  }

  getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}
