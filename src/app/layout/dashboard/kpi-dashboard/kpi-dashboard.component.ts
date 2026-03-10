import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { ChartComponent } from 'ng-apexcharts';
import { BsDaterangepickerDirective } from 'ngx-bootstrap/datepicker';

import { routes } from '../../../shared/routes/routes';
import { CommonService } from '../../../shared/common/common.service';
import { AuthService } from '../../../auth/auth.service';
import { KpiService } from '../services/kpi.service';
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
  KpiTerritoryOverviewModel,
  KpiAgentVisitSummaryModel,
  KpiPOSInsightModel,
  KpiTargetVsActualModel,
  KpiAbsenceAlertModel,
  KpiPeriodDataModel,
  KpiNDAnalysisModel,
} from '../models/dashboard.models';

export type KpiSection =
  | 'overview'
  | 'agents'
  | 'pos'
  | 'targets'
  | 'absences'
  | 'trends'
  | 'nd'
  | 'tableview';

export type KpiGeoLevel = 'province' | 'area' | 'subarea' | 'commune';
export type TrendPeriod = 'weekly' | 'monthly';
export type TargetLevel = 'province' | 'area';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: false,
  templateUrl: './kpi-dashboard.component.html',
  styleUrl: './kpi-dashboard.component.scss',
})
export class KpiDashboardComponent implements OnInit, AfterViewChecked {

  // ── DI ─────────────────────────────────────────────────────────────────────
  private common          = inject(CommonService);
  private fb              = inject(FormBuilder);
  private cdr             = inject(ChangeDetectorRef);
  private router          = inject(Router);
  private authService     = inject(AuthService);
  private kpiService      = inject(KpiService);
  private countryService  = inject(CountryService);
  private provinceService = inject(ProvinceService);
  private areaService     = inject(AreaService);
  private subAreaService  = inject(SubareaService);
  private communeService  = inject(CommuneService);

  // ── Router context ─────────────────────────────────────────────────────────
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
    { key: '1w',     label: '7 jours'     },
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

  selectedCountry?:  ICountry;
  selectedProvince?: IProvince;
  selectedArea?:     IArea;
  selectedSubArea?:  ISubArea;
  selectedCommune?:  ICommune;

  // ── UI state — signals ─────────────────────────────────────────────────────
  activeSection  = signal<KpiSection>('overview');
  geoLevel       = signal<KpiGeoLevel>('province');
  targetLevel    = signal<TargetLevel>('area');
  trendPeriod    = signal<TrendPeriod>('monthly');
  trendPeriods   = signal<number>(6);
  ndLevel        = signal<KpiGeoLevel>('commune');
  titleFilter    = signal<string>('');

  readonly TITLES = ['', 'ASM', 'Supervisor', 'DR', 'Cyclo'];

  // ── Loading flags — signals ────────────────────────────────────────────────
  isLoadingOverview  = signal(false);
  isLoadingAgents    = signal(false);
  isLoadingPOS       = signal(false);
  isLoadingTargets   = signal(false);
  isLoadingAbsences  = signal(false);
  isLoadingTrends    = signal(false);
  isLoadingND        = signal(false);

  // ── Data — signals ─────────────────────────────────────────────────────────
  overviewData  = signal<KpiTerritoryOverviewModel[]>([]);
  agentsData    = signal<KpiAgentVisitSummaryModel[]>([]);
  posData       = signal<KpiPOSInsightModel[]>([]);
  targetsData   = signal<KpiTargetVsActualModel[]>([]);
  absencesData  = signal<KpiAbsenceAlertModel[]>([]);
  trendsData    = signal<KpiPeriodDataModel[]>([]);
  ndData        = signal<KpiNDAnalysisModel[]>([]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  overviewStats = computed(() => {
    const d = this.overviewData();
    const count = d.length || 1;
    return {
      avgScore:      +(d.reduce((s, r) => s + r.overall_score,      0) / count).toFixed(1),
      avgSyncRate:   +(d.reduce((s, r) => s + r.sync_rate,          0) / count).toFixed(1),
      avgPosVisited: +(d.reduce((s, r) => s + r.visited_percentage, 0) / count).toFixed(1),
      totalVisits:   d.reduce((s, r) => s + r.total_visits, 0),
      critical:      d.filter(r => r.overall_score < 50).length,
      excellent:     d.filter(r => r.overall_score >= 85).length,
    };
  });

  agentsStats = computed(() => {
    const d = this.agentsData();
    const count = d.length || 1;
    return {
      totalAgents: d.length,
      avgDailyPct: +(d.reduce((s, r) => s + r.daily_pct, 0) / count).toFixed(1),
      onTrack:     d.filter(r => r.range_pct >= 80).length,
      underTarget: d.filter(r => r.range_pct < 50).length,
    };
  });

  absencesStats = computed(() => {
    const d = this.absencesData();
    return {
      critical: d.filter(r => r.alert_level.includes('CRITICAL')).length,
      warning:  d.filter(r => r.alert_level.includes('WARNING')).length,
      total:    d.length,
    };
  });

  // ── Charts ─────────────────────────────────────────────────────────────────
  chartTrendsOpts = signal<any>(null);
  chartNDOpts     = signal<any>(null);
  chartTargetOpts = signal<any>(null);

  private _openPickerOnNextCheck = false;
  @ViewChild('dateRangeInput') dateRangePicker?: BsDaterangepickerDirective;
  @ViewChild('chartTrends') chartTrendsRef!: ChartComponent;
  @ViewChild('chartND')     chartNDRef!:     ChartComponent;
  @ViewChild('chartTarget') chartTargetRef!: ChartComponent;

  // ── Absence drill-down ─────────────────────────────────────────────────────
  daysInactive = signal<number>(7);

  // ── Excel export ───────────────────────────────────────────────────────────
  isExporting = signal(false);

  // ─────────────────────────────────────────────────────────────────────────────
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
      next: user => {
        this.currentUser = user;
        this.countryService.getAll().subscribe(res => {
          this.countryList.set(res.data);
          const defaultCountry =
            (user.role !== 'Managers' && user.role !== 'Support')
              ? res.data[0]
              : (res.data.find((c: ICountry) => c.uuid === user.country_uuid) ?? res.data[0]);
          this.selectedCountry = defaultCountry;

          this.provinceService.getAll().subscribe(pr => {
            this.provinceList.set(pr.data);
            const defaultProvince =
              (user.role !== 'Managers' && user.role !== 'Support')
                ? pr.data[0]
                : (pr.data.find((p: IProvince) => p.uuid === user.province_uuid) ?? pr.data[0]);
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

  // ── Geo shortcuts ──────────────────────────────────────────────────────────
  get country_uuid()  { return this.selectedCountry?.uuid  ?? ''; }
  get province_uuid() { return this.selectedProvince?.uuid ?? ''; }
  get area_uuid()     { return this.selectedArea?.uuid     ?? ''; }
  get sub_area_uuid() { return this.selectedSubArea?.uuid  ?? ''; }
  get commune_uuid()  { return this.selectedCommune?.uuid  ?? ''; }

  // ── Section loaders ────────────────────────────────────────────────────────
  loadAllSections(): void {
    this.loadOverview();
    this.loadAgents();
    this.loadTargets();
    this.loadAbsences();
    this.loadTrends();
    this.loadND();
    if (this.commune_uuid) this.loadPOS();
  }

  loadOverview(): void {
    if (!this.country_uuid) return;
    this.isLoadingOverview.set(true);
    this.kpiService.TerritoryOverview({
      level:      this.geoLevel(),
      start_date: this.start_date,
      end_date:   this.end_date,
      limit:      50,
    }).subscribe({
      next: res => { this.overviewData.set(res.data ?? []); this.isLoadingOverview.set(false); },
      error: ()  => this.isLoadingOverview.set(false),
    });
  }

  loadAgents(): void {
    if (!this.country_uuid) return;
    this.isLoadingAgents.set(true);
    this.kpiService.UserVisitSummary({
      country_uuid:  this.country_uuid,
      province_uuid: this.province_uuid || undefined,
      area_uuid:     this.area_uuid     || undefined,
      sub_area_uuid: this.sub_area_uuid || undefined,
      commune_uuid:  this.commune_uuid  || undefined,
      start_date:    this.start_date,
      end_date:      this.end_date,
      title:         this.titleFilter() || undefined,
    }).subscribe({
      next: res => { this.agentsData.set(res.data ?? []); this.isLoadingAgents.set(false); },
      error: ()  => this.isLoadingAgents.set(false),
    });
  }

  loadPOS(): void {
    if (!this.commune_uuid) return;
    this.isLoadingPOS.set(true);
    this.kpiService.POSInsights({
      commune_uuid: this.commune_uuid,
      start_date:   this.start_date,
      end_date:     this.end_date,
    }).subscribe({
      next: res => { this.posData.set(res.data ?? []); this.isLoadingPOS.set(false); },
      error: ()  => this.isLoadingPOS.set(false),
    });
  }

  loadTargets(): void {
    this.isLoadingTargets.set(true);
    this.kpiService.TargetVsActual({
      level:      this.targetLevel(),
      start_date: this.start_date,
      end_date:   this.end_date,
    }).subscribe({
      next: res => {
        this.targetsData.set(res.data ?? []);
        this.buildTargetChart();
        this.isLoadingTargets.set(false);
      },
      error: () => this.isLoadingTargets.set(false),
    });
  }

  loadAbsences(): void {
    this.isLoadingAbsences.set(true);
    this.kpiService.AbsenceAnalysis({ days_inactive: this.daysInactive() }).subscribe({
      next: res => { this.absencesData.set(res.data ?? []); this.isLoadingAbsences.set(false); },
      error: ()  => this.isLoadingAbsences.set(false),
    });
  }

  loadTrends(): void {
    this.isLoadingTrends.set(true);
    this.kpiService.PeriodComparison({
      period:  this.trendPeriod(),
      periods: this.trendPeriods(),
    }).subscribe({
      next: res => {
        this.trendsData.set(res.data ?? []);
        this.buildTrendsChart();
        this.isLoadingTrends.set(false);
      },
      error: () => this.isLoadingTrends.set(false),
    });
  }

  loadND(): void {
    this.isLoadingND.set(true);
    this.kpiService.NDAnalysis({
      level:      this.ndLevel(),
      start_date: this.start_date,
      end_date:   this.end_date,
    }).subscribe({
      next: res => {
        this.ndData.set(res.data ?? []);
        this.buildNDChart();
        this.isLoadingND.set(false);
      },
      error: () => this.isLoadingND.set(false),
    });
  }

  // ── Chart builders ─────────────────────────────────────────────────────────
  buildTrendsChart(): void {
    const data = this.trendsData();
    if (!data.length) { this.chartTrendsOpts.set(null); return; }
    this.chartTrendsOpts.set({
      series: [
        { name: 'Visites',    type: 'bar',  data: data.map(d => d.visits) },
        { name: 'POS Visités',type: 'bar',  data: data.map(d => d.pos_visited) },
        { name: 'Sync %',     type: 'line', data: data.map(d => d.sync_rate) },
        { name: 'POS-MM %',   type: 'line', data: data.map(d => d.posmm_percentage) },
      ],
      chart: { height: 360, toolbar: { show: false }, animations: { enabled: true } },
      colors: ['#4361ee', '#06d6a0', '#f72585', '#ffd166'],
      stroke: { width: [0, 0, 2.5, 2.5], curve: 'smooth' },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: { categories: data.map(d => d.period_label) },
      yaxis: [
        { title: { text: 'Visites' }, seriesName: 'Visites' },
        { show: false, seriesName: 'POS Visités' },
        { opposite: true, title: { text: '% Rate' }, seriesName: 'Sync %',
          labels: { formatter: (v: number) => `${v}%` }, min: 0, max: 100 },
        { show: false, seriesName: 'POS-MM %' },
      ],
      legend:  { position: 'top' },
      tooltip: { shared: true, intersect: false },
      grid:    { strokeDashArray: 4 },
    });
  }

  buildTargetChart(): void {
    const data = this.targetsData().slice(0, 15);
    if (!data.length) { this.chartTargetOpts.set(null); return; }
    this.chartTargetOpts.set({
      series: [
        { name: 'Réalisé',  data: data.map(d => d.actual_visits) },
        { name: 'Objectif', data: data.map(d => d.target_visits) },
      ],
      chart:       { type: 'bar', height: Math.max(320, data.length * 48), toolbar: { show: false } },
      colors:      ['#4361ee', '#e2e8f0'],
      plotOptions: {
        bar: {
          horizontal: true, barHeight: '60%', borderRadius: 4,
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: { enabled: true, offsetX: 4,
        formatter: (v: number) => v.toLocaleString(),
        style: { fontSize: '10px', colors: ['#333'] } },
      xaxis:   { categories: data.map(d => d.territory) },
      legend:  { position: 'top' },
      tooltip: { shared: true, y: { formatter: (v: number) => v.toLocaleString() } },
      grid:    { strokeDashArray: 3, xaxis: { lines: { show: true } } },
    });
  }

  buildNDChart(): void {
    const data = this.ndData().slice(0, 20);
    if (!data.length) { this.chartNDOpts.set(null); return; }
    this.chartNDOpts.set({
      series: [
        { name: 'ND %',   data: data.map(d => +d.nd_percentage.toFixed(1)) },
        { name: 'OOS %',  data: data.map(d => +d.oos_percentage.toFixed(1)) },
        { name: 'POS-MM %', data: data.map(d => +d.posmm_integration.toFixed(1)) },
      ],
      chart:       { type: 'radar', height: 380, toolbar: { show: false } },
      colors:      ['#4361ee', '#ef476f', '#06d6a0'],
      stroke:      { width: 2 },
      fill:        { opacity: 0.15 },
      markers:     { size: 4 },
      xaxis:       { categories: data.map(d => d.territory) },
      yaxis:       { show: false },
      dataLabels:  { enabled: false },
      legend:      { position: 'top' },
      tooltip:     { y: { formatter: (v: number) => `${v}%` } },
    });
  }

  // ── Geo event handlers ─────────────────────────────────────────────────────
  onCountryChange(c: ICountry): void {
    this.selectedCountry  = c;
    this.selectedProvince = undefined;
    this.selectedArea     = undefined;
    this.selectedSubArea  = undefined;
    this.selectedCommune  = undefined;
    this.provinceList.set([]);
    this.areaList.set([]); this.subAreaList.set([]); this.communeList.set([]);
    this.provinceService.getAll().subscribe(res =>
      this.provinceList.set(res.data.filter((p: IProvince) => p.country_uuid === c.uuid))
    );
    this.loadAllSections();
  }

  onProvinceChange(p: IProvince): void {
    this.selectedProvince = p;
    this.selectedArea     = undefined;
    this.selectedSubArea  = undefined;
    this.selectedCommune  = undefined;
    this.areaList.set([]); this.subAreaList.set([]); this.communeList.set([]);
    if (p) this.areaService.getAll().subscribe(res =>
      this.areaList.set(res.data.filter((a: IArea) => a.province_uuid === p.uuid))
    );
    this.loadAllSections();
  }

  onAreaChange(a: IArea): void {
    this.selectedArea    = a;
    this.selectedSubArea = undefined;
    this.selectedCommune = undefined;
    this.subAreaList.set([]); this.communeList.set([]);
    if (a) this.subAreaService.getAll().subscribe(res =>
      this.subAreaList.set(res.data.filter((s: ISubArea) => s.area_uuid === a.uuid))
    );
    this.loadAllSections();
  }

  onSubAreaChange(s: ISubArea): void {
    this.selectedSubArea = s;
    this.selectedCommune = undefined;
    this.communeList.set([]);
    if (s) this.communeService.getAll().subscribe(res =>
      this.communeList.set(res.data.filter((c: ICommune) => c.sub_area_uuid === s.uuid))
    );
    this.loadAllSections();
  }

  onCommuneChange(c: ICommune): void {
    this.selectedCommune = c;
    this.loadAllSections();
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  setSection(s: KpiSection): void {
    this.activeSection.set(s);
    if (s === 'tableview') {
      this.router.navigate([
        this.routes.dashboard,
        'key-performance-indicators',
        'province',
        this.country_uuid || 'all',
      ]);
    }
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
      case '3m':    start = new Date(today); start.setMonth(today.getMonth() - 3); break;
      case '6m':    start = new Date(today); start.setMonth(today.getMonth() - 6); break;
      case '1y':    start = new Date(today); start.setFullYear(today.getFullYear() - 1); break;
      default: return;
    }
    this.start_date = formatDate(start, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(end,   'yyyy-MM-dd', 'en-US');
    this.loadAllSections();
  }

  onGeoLevelChange(level: KpiGeoLevel): void {
    this.geoLevel.set(level);
    this.loadOverview();
  }

  onTargetLevelChange(level: TargetLevel): void {
    this.targetLevel.set(level);
    this.loadTargets();
  }

  onTrendPeriodChange(p: TrendPeriod): void {
    this.trendPeriod.set(p);
    this.loadTrends();
  }

  onNdLevelChange(level: KpiGeoLevel): void {
    this.ndLevel.set(level);
    this.loadND();
  }

  onTitleFilterChange(title: string): void {
    this.titleFilter.set(title);
    this.loadAgents();
  }

  onDaysInactiveChange(days: number): void {
    this.daysInactive.set(days);
    this.loadAbsences();
  }

  // ── Display helpers ────────────────────────────────────────────────────────
  getPeriodLabel(): string {
    return this.PERIODS.find(p => p.key === this.selectedPeriod())?.label ?? 'Période';
  }

  getScoreClass(score: number): string {
    if (score >= 85) return 'kpi-score-excellent';
    if (score >= 70) return 'kpi-score-good';
    if (score >= 50) return 'kpi-score-fair';
    return 'kpi-score-poor';
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#06d6a0';
    if (score >= 70) return '#4361ee';
    if (score >= 50) return '#ffd166';
    return '#ef476f';
  }

  getRatingIcon(rating: string): string {
    if (rating.includes('EXCELLENT')) return 'ti ti-star-filled text-success';
    if (rating.includes('GOOD'))      return 'ti ti-thumb-up text-primary';
    if (rating.includes('FAIR'))      return 'ti ti-alert-triangle text-warning';
    return 'ti ti-x text-danger';
  }

  getPctClass(pct: number): string {
    if (pct >= 100) return 'text-success fw-bold';
    if (pct >= 80)  return 'text-primary fw-semibold';
    if (pct >= 50)  return 'text-warning';
    return 'text-danger';
  }

  getPctBarColor(pct: number): string {
    if (pct >= 100) return 'bg-success';
    if (pct >= 80)  return 'bg-primary';
    if (pct >= 50)  return 'bg-warning';
    return 'bg-danger';
  }

  getPctBarWidth(pct: number): string {
    return `${Math.min(pct, 100)}%`;
  }

  getAlertClass(level: string): string {
    if (level.includes('CRITICAL')) return 'kpi-alert-critical';
    if (level.includes('WARNING'))  return 'kpi-alert-warning';
    return 'kpi-alert-ok';
  }

  getAlertBadge(level: string): string {
    if (level.includes('CRITICAL')) return 'badge bg-danger';
    if (level.includes('WARNING'))  return 'badge bg-warning text-dark';
    return 'badge bg-success';
  }

  getAlertIcon(level: string): string {
    if (level.includes('CRITICAL')) return 'ti ti-alert-triangle';
    if (level.includes('WARNING'))  return 'ti ti-alert-circle';
    return 'ti ti-circle-check';
  }

  getCoverageIcon(status: string): string {
    if (status.includes('NOT_VISITED'))    return 'ti ti-circle-x text-danger';
    if (status.includes('NEEDS_ATTENTION')) return 'ti ti-alert-circle text-warning';
    if (status.includes('WARNING'))        return 'ti ti-alert-triangle text-warning';
    return 'ti ti-circle-check text-success';
  }

  getRiskBadge(risk: string): string {
    if (risk === 'HIGH')   return 'badge bg-danger';
    if (risk === 'MEDIUM') return 'badge bg-warning text-dark';
    return 'badge bg-success';
  }

  getTitleIcon(title: string): string {
    switch (title) {
      case 'ASM':        return 'ti ti-user-star';
      case 'Supervisor': return 'ti ti-users';
      case 'DR':         return 'ti ti-motorbike';
      case 'Cyclo':      return 'ti ti-bike';
      default:           return 'ti ti-user';
    }
  }

  getNDDensityClass(score: number): string {
    if (score >= 75) return 'text-success fw-bold';
    if (score >= 50) return 'text-primary';
    if (score >= 25) return 'text-warning';
    return 'text-danger';
  }

  trackByUUID(_: number, item: any): string {
    return item.territory_uuid ?? item.agent_uuid ?? item.pos_uuid ?? item.territory ?? _;
  }

  compareById(a: any, b: any): boolean {
    return a && b ? a.uuid === b.uuid : a === b;
  }

  // ── Excel export ───────────────────────────────────────────────────────────
  exportExcel(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.kpiService.ExportExcel({
      country_uuid:  this.country_uuid  || undefined,
      province_uuid: this.province_uuid || undefined,
      area_uuid:     this.area_uuid     || undefined,
      sub_area_uuid: this.sub_area_uuid || undefined,
      commune_uuid:  this.commune_uuid  || undefined,
      start_date:    this.start_date,
      end_date:      this.end_date,
      title:         this.titleFilter() || undefined,
    }).subscribe({
      next: (blob) => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `rapport_kpi_${this.start_date}_${this.end_date}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        this.isExporting.set(false);
      },
      error: () => this.isExporting.set(false),
    });
  }
}
