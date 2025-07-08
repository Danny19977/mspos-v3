import { Component, OnInit, ChangeDetectorRef, computed, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

// Services
import { AuthService } from '../../../auth/auth.service';
import { SummaryDashboardService } from '../services/summary-dashboard.service';
import { CountryService } from '../../territories/country/country.service';
import { ProvinceService } from '../../territories/province/province.service';
import { AreaService } from '../../territories/areas/area.service';
import { SubareaService } from '../../territories/subarea/subarea.service';

// Models
import { IUser } from '../../management/user/models/user.model';
import { ICountry } from '../../territories/country/models/country.model';
import { IProvince } from '../../territories/province/models/province.model';
import { IArea } from '../../territories/areas/models/area.model';
import { ISubArea } from '../../territories/subarea/models/subarea.model';
import {
  ExecutiveSummaryResponse,
  RegionalSummaryResponse,
  QuickDashboardResponse,
  CompetitiveAnalysisResponse,
  SummaryFilters,
  CompetitiveFilters,
  OverviewMetrics,
  PerformanceMetrics,
  GeographicMetrics,
  TeamPerformanceMetrics,
  TrendMetrics,
  QuickMetrics
} from '../models/summary-dashboard.models';

// Interface pour les onglets du dashboard
interface DashboardTab {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

// Interface pour les cartes de métriques
interface MetricCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  format?: 'number' | 'percentage' | 'currency';
}

@Component({
  selector: 'app-summary-dashboard',
  standalone: false,
  templateUrl: './summary-dashboard.component.html',
  styleUrl: './summary-dashboard.component.scss'
})
export class SummaryDashboardComponent implements OnInit {
  // États de chargement et utilisateur
  isLoading = false;
  isLoadingExecutive = false;
  isLoadingRegional = false;
  isLoadingQuick = false;
  isLoadingCompetitive = false;
  currentUser!: IUser;

  // FormGroup pour les filtres
  dateRange!: FormGroup;
  rangeDate: Date[] = [];

  // Filtres géographiques
  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );

  provinceList: IProvince[] = [];
  areaList: IArea[] = [];
  subareaList: ISubArea[] = [];

  // Sélections géographiques actuelles
  selectedCountry: ICountry = {} as ICountry;
  selectedProvince: IProvince | null = null;
  selectedArea: IArea | null = null;
  selectedSubarea: ISubArea | null = null;

  // Onglets du dashboard
  dashboardTabs: DashboardTab[] = [
    { id: 'executive', label: 'Vue Exécutive', icon: 'fe-bar-chart-2', active: true },
    { id: 'regional', label: 'Analyse Régionale', icon: 'fe-map-pin', active: false },
    { id: 'quick', label: 'Dashboard Rapide', icon: 'fe-zap', active: false },
    { id: 'competitive', label: 'Analyse Concurrentielle', icon: 'fe-trending-up', active: false }
  ];

  activeTab = 'executive';

  // Données du dashboard exécutif
  executiveSummary: ExecutiveSummaryResponse | null = null;
  executiveMetricCards: MetricCard[] = [];

  // Données du dashboard régional
  regionalSummary: RegionalSummaryResponse | null = null;
  regionalMetricCards: MetricCard[] = [];

  // Données du dashboard rapide
  quickDashboard: QuickDashboardResponse | null = null;
  quickMetricCards: MetricCard[] = [];

  // Données de l'analyse concurrentielle
  competitiveAnalysis: CompetitiveAnalysisResponse | null = null;
  competitiveMetricCards: MetricCard[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private summaryDashboardService: SummaryDashboardService,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private areaService: AreaService,
    private subareaService: SubareaService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeDateRange();
    this.initializeUser();
  }

  /**
   * Initialise la plage de dates par défaut (mois courant)
   */
  private initializeDateRange(): void {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      period: new FormControl(this.rangeDate)
    });
  }

  /**
   * Initialise l'utilisateur et charge les données initiales
   */
  private initializeUser(): void {
    this.isLoading = true;

    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadCountries();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        this.isLoading = false;
        this.router.navigate(['/auth/login']);
      }
    });
  }

  /**
   * Charge la liste des pays
   */
  private loadCountries(): void {
    this.countryService.getAll().subscribe({
      next: (res) => {
        this.countryList.set(res.data);
        
        // Sélectionne le pays de l'utilisateur ou le premier pays disponible
        if (this.currentUser.role !== 'Managers' && this.currentUser.role !== 'Support') {
          const userCountry = this.countryList().find(c => c.uuid === this.currentUser.country_uuid);
          if (userCountry) {
            this.selectedCountry = userCountry;
            this.loadProvinces(userCountry.uuid);
          }
        } else if (this.countryList().length > 0) {
          this.selectedCountry = this.countryList()[0];
          this.loadProvinces(this.selectedCountry.uuid);
        }

        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pays:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Charge les provinces d'un pays
   */
  private loadProvinces(countryUuid: string): void {
    this.provinceService.getAll().subscribe({
      next: (res: any) => {
        this.provinceList = res.data ? res.data.filter((p: any) => p.country_uuid === countryUuid) : [];
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des provinces:', error);
      }
    });
  }

  /**
   * Charge les aires d'une province
   */
  private loadAreas(provinceUuid: string): void {
    this.areaService.getAllSupAreaById(provinceUuid).subscribe({
      next: (res: any) => {
        this.areaList = res.data || [];
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des aires:', error);
      }
    });
  }

  /**
   * Charge les sous-aires d'une aire
   */
  private loadSubareas(areaUuid: string): void {
    this.subareaService.getAllById(areaUuid).subscribe({
      next: (res: any) => {
        this.subareaList = res.data || [];
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des sous-aires:', error);
      }
    });
  }

  /**
   * Charge les données du dashboard selon l'onglet actif
   */
  private loadDashboardData(): void {
    switch (this.activeTab) {
      case 'executive':
        this.loadExecutiveSummary();
        break;
      case 'regional':
        this.loadRegionalSummary();
        break;
      case 'quick':
        this.loadQuickDashboard();
        break;
      case 'competitive':
        this.loadCompetitiveAnalysis();
        break;
    }
  }

  /**
   * Charge le résumé exécutif
   */
  private loadExecutiveSummary(): void {
    this.isLoadingExecutive = true;
    const filters = this.buildSummaryFilters();
    
    this.summaryDashboardService.getExecutiveSummary(filters).subscribe({
      next: (response) => {
        this.executiveSummary = response.data;
        this.buildExecutiveMetricCards();
        this.isLoading = false;
        this.isLoadingExecutive = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement du résumé exécutif:', error);
        this.isLoading = false;
        this.isLoadingExecutive = false;
      }
    });
  }

  /**
   * Charge le résumé régional
   */
  private loadRegionalSummary(): void {
    this.isLoadingRegional = true;
    const filters = this.buildSummaryFilters();
    
    this.summaryDashboardService.getRegionalSummary(filters).subscribe({
      next: (response) => {
        this.regionalSummary = response.data;
        this.buildRegionalMetricCards();
        this.isLoading = false;
        this.isLoadingRegional = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement du résumé régional:', error);
        this.isLoading = false;
        this.isLoadingRegional = false;
      }
    });
  }

  /**
   * Charge le dashboard rapide
   */
  private loadQuickDashboard(): void {
    this.isLoadingQuick = true;
    const countryUuid = this.selectedCountry.uuid || '';
    
    this.summaryDashboardService.getQuickDashboard(countryUuid).subscribe({
      next: (response) => {
        this.quickDashboard = response.data;
        this.buildQuickMetricCards();
        this.isLoading = false;
        this.isLoadingQuick = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard rapide:', error);
        this.isLoading = false;
        this.isLoadingQuick = false;
      }
    });
  }

  /**
   * Charge l'analyse concurrentielle
   */
  private loadCompetitiveAnalysis(): void {
    this.isLoadingCompetitive = true;
    const filters = this.buildCompetitiveFilters();
    
    this.summaryDashboardService.getCompetitiveAnalysis(filters).subscribe({
      next: (response) => {
        this.competitiveAnalysis = response.data;
        this.buildCompetitiveMetricCards();
        this.isLoading = false;
        this.isLoadingCompetitive = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'analyse concurrentielle:', error);
        this.isLoading = false;
        this.isLoadingCompetitive = false;
      }
    });
  }

  /**
   * Construit les filtres pour les requêtes de résumé
   */
  private buildSummaryFilters(): SummaryFilters {
    const dates = this.dateRange.value.period;
    return {
      countryUuid: this.selectedCountry.uuid || '',
      provinceUuid: this.selectedProvince?.uuid || '',
      areaUuid: this.selectedArea?.uuid || '',
      subAreaUuid: this.selectedSubarea?.uuid || '',
      startDate: formatDate(dates[0], 'yyyy-MM-dd', 'en-US'),
      endDate: formatDate(dates[1], 'yyyy-MM-dd', 'en-US')
    };
  }

  /**
   * Construit les filtres pour l'analyse concurrentielle
   */
  private buildCompetitiveFilters(): CompetitiveFilters {
    const dates = this.dateRange.value.period;
    return {
      countryUuid: this.selectedCountry.uuid || '',
      currentStart: formatDate(dates[0], 'yyyy-MM-dd', 'en-US'),
      currentEnd: formatDate(dates[1], 'yyyy-MM-dd', 'en-US'),
      previousStart: formatDate(new Date(dates[0].getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd', 'en-US'),
      previousEnd: formatDate(new Date(dates[1].getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd', 'en-US')
    };
  }

  /**
   * Construit les cartes de métriques pour le dashboard exécutif
   */
  private buildExecutiveMetricCards(): void {
    if (!this.executiveSummary) return;

    this.executiveMetricCards = [
      {
        title: 'Total POS',
        value: this.executiveSummary.overview.totalPOS,
        icon: 'fe-map-pin',
        color: 'primary',
        format: 'number'
      },
      {
        title: 'POS Actifs',
        value: this.executiveSummary.overview.activePOS,
        icon: 'fe-check-circle',
        color: 'success',
        format: 'number'
      },
      {
        title: 'Total Visites',
        value: this.executiveSummary.overview.totalVisits,
        icon: 'fe-eye',
        color: 'info',
        format: 'number'
      },
      {
        title: 'Utilisateurs Actifs',
        value: this.executiveSummary.overview.totalUsers,
        icon: 'fe-users',
        color: 'warning',
        format: 'number'
      },
      {
        title: 'Taux d\'Objectif Visites',
        value: this.executiveSummary.performance.visitObjectiveRate,
        icon: 'fe-target',
        color: this.getPerformanceColor(this.executiveSummary.performance.visitObjectiveRate),
        format: 'percentage'
      },
      {
        title: 'Taux de Complétion',
        value: this.executiveSummary.performance.completionRate,
        icon: 'fe-check',
        color: this.getPerformanceColor(this.executiveSummary.performance.completionRate),
        format: 'percentage'
      },
      {
        title: 'Score d\'Efficacité',
        value: this.executiveSummary.performance.efficiencyScore,
        icon: 'fe-trending-up',
        color: this.getPerformanceColor(this.executiveSummary.performance.efficiencyScore),
        format: 'percentage'
      },
      {
        title: 'Pénétration Marché',
        value: this.executiveSummary.overview.marketPenetration,
        icon: 'fe-pie-chart',
        color: 'info',
        format: 'percentage'
      }
    ];
  }

  /**
   * Construit les cartes de métriques pour le dashboard régional
   */
  private buildRegionalMetricCards(): void {
    if (!this.regionalSummary) return;

    this.regionalMetricCards = [
      {
        title: 'Visites Cette Période',
        value: this.regionalSummary.performance.visitsThisPeriod,
        icon: 'fe-map',
        color: 'primary',
        format: 'number'
      },
      {
        title: 'Taux d\'Objectif',
        value: this.regionalSummary.performance.objectiveRate,
        icon: 'fe-map-pin',
        color: 'success',
        format: 'percentage'
      },
      {
        title: 'Total POS',
        value: this.regionalSummary.regionInfo.totalPOS,
        icon: 'fe-grid',
        color: 'info',
        format: 'number'
      },
      {
        title: 'Utilisateurs Actifs',
        value: this.regionalSummary.regionInfo.totalUsers,
        icon: 'fe-calendar',
        color: 'warning',
        format: 'number'
      }
    ];
  }

  /**
   * Construit les cartes de métriques pour le dashboard rapide
   */
  private buildQuickMetricCards(): void {
    if (!this.quickDashboard) return;

    this.quickMetricCards = [
      {
        title: 'Visites Aujourd\'hui',
        value: this.quickDashboard.keyMetrics.visitsToday,
        icon: 'fe-zap',
        color: 'primary',
        format: 'number'
      },
      {
        title: 'Visites Cette Semaine',
        value: this.quickDashboard.keyMetrics.visitsThisWeek,
        icon: 'fe-flash',
        color: 'success',
        format: 'number'
      },
      {
        title: 'Visites Ce Mois',
        value: this.quickDashboard.keyMetrics.visitsThisMonth,
        icon: 'fe-activity',
        color: 'info',
        format: 'number'
      },
      {
        title: 'Utilisateurs Actifs',
        value: this.quickDashboard.keyMetrics.activeUsersToday,
        icon: 'fe-award',
        color: 'warning',
        format: 'number'
      }
    ];
  }

  /**
   * Construit les cartes de métriques pour l'analyse concurrentielle
   */
  private buildCompetitiveMetricCards(): void {
    if (!this.competitiveAnalysis) return;

    this.competitiveMetricCards = [
      {
        title: 'Visites Actuelles',
        value: this.competitiveAnalysis.currentPeriod.totalVisits,
        icon: 'fe-trending-up',
        color: 'primary',
        format: 'number'
      },
      {
        title: 'Taux de Complétion',
        value: this.competitiveAnalysis.currentPeriod.completionRate,
        icon: 'fe-pie-chart',
        color: 'success',
        format: 'percentage'
      },
      {
        title: 'Score d\'Efficacité',
        value: this.competitiveAnalysis.currentPeriod.efficiencyScore,
        icon: 'fe-shield',
        color: 'info',
        format: 'percentage'
      },
      {
        title: 'Croissance',
        value: this.competitiveAnalysis.comparison.visitGrowth,
        icon: 'fe-bar-chart',
        color: 'warning',
        format: 'percentage'
      }
    ];
  }

  // =================== GESTIONNAIRES D'ÉVÉNEMENTS ===================

  /**
   * Gestionnaire de changement de plage de dates
   */
  onDateRangeChange(dateRange: (Date | undefined)[] | undefined): void {
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      this.rangeDate = [dateRange[0], dateRange[1]];
      this.refreshDashboard();
    }
  }

  /**
   * Gestionnaire de changement de pays
   */
  onCountryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const countryUuid = target.value;
    
    if (countryUuid) {
      const country = this.countryList().find(c => c.uuid === countryUuid);
      if (country) {
        this.selectedCountry = country;
        this.selectedProvince = null;
        this.selectedArea = null;
        this.selectedSubarea = null;
        this.provinceList = [];
        this.areaList = [];
        this.subareaList = [];
        
        this.loadProvinces(countryUuid);
        this.refreshDashboard();
      }
    }
  }

  /**
   * Gestionnaire de changement de province
   */
  onProvinceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const provinceUuid = target.value;
    
    if (provinceUuid) {
      const province = this.provinceList.find(p => p.uuid === provinceUuid);
      if (province) {
        this.selectedProvince = province;
        this.selectedArea = null;
        this.selectedSubarea = null;
        this.areaList = [];
        this.subareaList = [];
        
        this.loadAreas(provinceUuid);
        this.refreshDashboard();
      }
    } else {
      this.selectedProvince = null;
      this.selectedArea = null;
      this.selectedSubarea = null;
      this.areaList = [];
      this.subareaList = [];
      this.refreshDashboard();
    }
  }

  /**
   * Gestionnaire de changement d'aire
   */
  onAreaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const areaUuid = target.value;
    
    if (areaUuid) {
      const area = this.areaList.find(a => a.uuid === areaUuid);
      if (area) {
        this.selectedArea = area;
        this.selectedSubarea = null;
        this.subareaList = [];
        
        this.loadSubareas(areaUuid);
        this.refreshDashboard();
      }
    } else {
      this.selectedArea = null;
      this.selectedSubarea = null;
      this.subareaList = [];
      this.refreshDashboard();
    }
  }

  /**
   * Gestionnaire de changement de sous-aire
   */
  onSubareaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const subareaUuid = target.value;
    
    if (subareaUuid) {
      const subarea = this.subareaList.find(s => s.uuid === subareaUuid);
      if (subarea) {
        this.selectedSubarea = subarea;
        this.refreshDashboard();
      }
    } else {
      this.selectedSubarea = null;
      this.refreshDashboard();
    }
  }

  /**
   * Gestionnaire de changement d'onglet
   */
  onTabChange(tabId: string): void {
    this.dashboardTabs.forEach(tab => tab.active = tab.id === tabId);
    this.activeTab = tabId;
    this.isLoading = true;
    this.loadDashboardData();
  }

  /**
   * Sélectionne un onglet (alias pour onTabChange)
   */
  selectTab(tabId: string): void {
    this.onTabChange(tabId);
  }

  /**
   * Actualise le dashboard
   */
  refreshDashboard(): void {
    this.isLoading = true;
    this.loadDashboardData();
  }

  // =================== MÉTHODES UTILITAIRES ===================

  /**
   * Détermine la couleur selon la performance
   */
  private getPerformanceColor(value: number): string {
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'danger';
  }

  /**
   * Formate un nombre selon le type spécifié
   */
  formatNumber(value: number | string, format: 'number' | 'percentage' | 'currency' = 'number'): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return '0';

    switch (format) {
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'XOF'
        }).format(numValue);
      default:
        return new Intl.NumberFormat('fr-FR').format(numValue);
    }
  }

  /**
   * Obtient la classe CSS pour les icônes de tendance
   */
  getTrendClass(trend: number): string {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-danger';
    return 'text-muted';
  }

  /**
   * Obtient l'icône de tendance
   */
  getTrendIcon(trend: number): string {
    if (trend > 0) return 'fe-trending-up';
    if (trend < 0) return 'fe-trending-down';
    return 'fe-minus';
  }

  /**
   * Vérifie si l'utilisateur peut voir tous les pays
   */
  canViewAllCountries(): boolean {
    return this.currentUser.role === 'Managers' || this.currentUser.role === 'Support';
  }

  /**
   * Obtient les cartes de métriques pour l'onglet actif
   */
  getActiveMetricCards(): MetricCard[] {
    switch (this.activeTab) {
      case 'executive':
        return this.executiveMetricCards;
      case 'regional':
        return this.regionalMetricCards;
      case 'quick':
        return this.quickMetricCards;
      case 'competitive':
        return this.competitiveMetricCards;
      default:
        return [];
    }
  }

  /**
   * Obtient le titre de l'onglet actif
   */
  getActiveTabTitle(): string {
    const activeTabObj = this.dashboardTabs.find(tab => tab.id === this.activeTab);
    return activeTabObj ? activeTabObj.label : 'Dashboard';
  }

  /**
   * Obtient les cartes de vue d'ensemble pour l'onglet exécutif
   */
  getOverviewCards(): MetricCard[] {
    if (!this.executiveSummary) return [];

    return [
      {
        title: 'Total POS',
        value: this.executiveSummary.overview.totalPOS,
        icon: 'fe-map-pin',
        color: 'primary',
        format: 'number'
      },
      {
        title: 'POS Actifs',
        value: this.executiveSummary.overview.activePOS,
        icon: 'fe-check-circle',
        color: 'success',
        format: 'number'
      },
      {
        title: 'Total Visites',
        value: this.executiveSummary.overview.totalVisits,
        icon: 'fe-eye',
        color: 'info',
        format: 'number'
      },
      {
        title: 'Utilisateurs Actifs',
        value: this.executiveSummary.overview.totalUsers,
        icon: 'fe-users',
        color: 'warning',
        format: 'number'
      }
    ];
  }

  /**
   * Obtient les cartes de performance pour l'onglet exécutif
   */
  getPerformanceCards(): MetricCard[] {
    if (!this.executiveSummary) return [];

    return [
      {
        title: 'Taux d\'Objectif Visites',
        value: this.executiveSummary.performance.visitObjectiveRate,
        icon: 'fe-target',
        color: this.getPerformanceColor(this.executiveSummary.performance.visitObjectiveRate),
        format: 'percentage'
      },
      {
        title: 'Taux de Complétion',
        value: this.executiveSummary.performance.completionRate,
        icon: 'fe-check',
        color: this.getPerformanceColor(this.executiveSummary.performance.completionRate),
        format: 'percentage'
      },
      {
        title: 'Score d\'Efficacité',
        value: this.executiveSummary.performance.efficiencyScore,
        icon: 'fe-trending-up',
        color: this.getPerformanceColor(this.executiveSummary.performance.efficiencyScore),
        format: 'percentage'
      }
    ];
  }

  /**
   * Obtient les cartes de métriques rapides
   */
  getQuickMetricsCards(): MetricCard[] {
    return this.quickMetricCards;
  }

  /**
   * Calcule le pourcentage de progression pour les barres de performance
   */
  getProgressPercentage(value: number | string, title: string): number {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Pour les pourcentages, utiliser la valeur directement
    if (title.toLowerCase().includes('taux') || title.toLowerCase().includes('score')) {
      return Math.min(numValue, 100);
    }
    
    // Pour les autres métriques, normaliser sur 100
    return Math.min((numValue / 100) * 100, 100);
  }

  /**
   * Formate un pourcentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
