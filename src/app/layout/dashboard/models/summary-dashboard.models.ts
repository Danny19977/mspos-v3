// ======================== INTERFACES POUR SUMMARY DASHBOARD ========================
// Basées sur le contrôleur Go Fiber: https://github.com/Danny19977/mspos-api-V3/blob/main/controllers/dashboard/summary-dashboard.controller.go

// ======================== RÉPONSE API GÉNÉRIQUE ========================
export interface ApiSummaryResponse<T> {
  status: string;
  message: string;
  data: T;
}

// ======================== RÉSUMÉ EXÉCUTIF GLOBAL ========================
export interface ExecutiveSummaryResponse {
  overview: OverviewMetrics;
  performance: PerformanceMetrics;
  geographicDistribution: GeographicMetrics;
  teamPerformance: TeamPerformanceMetrics;
  trendAnalysis: TrendMetrics;
}

export interface OverviewMetrics {
  totalPOS: number;
  activePOS: number;
  totalVisits: number;
  totalUsers: number;
  totalProvinces: number;
  totalAreas: number;
  marketPenetration: number;
  averageVisitsPerDay: number;
}

export interface PerformanceMetrics {
  visitObjectiveRate: number;
  completionRate: number;
  efficiencyScore: number;
  topBrandPerformance: string;
  averageFormScore: number;
}

export interface GeographicMetrics {
  topPerformingProvince: string;
  topPerformingArea: string;
  topPerformingSubArea: string;
  topPerformingCommune: string;
  coveragePercentage: number;
}

export interface TeamPerformanceMetrics {
  totalTeamMembers: number;
  activeTeamMembers: number;
  topPerformer: string;
  averageTeamEfficiency: number;
}

export interface TrendMetrics {
  visitTrend: string; // 'croissante' | 'décroissante' | 'stable'
  monthlyGrowth: number;
  predictedNextMonth: number;
}

// ======================== RÉSUMÉ RÉGIONAL ========================
export interface RegionalSummaryResponse {
  regionInfo: RegionInfo;
  performance: RegionalPerformance;
  comparison: RegionalComparison;
  topPerformers: TopPerformer[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
}

export interface RegionInfo {
  name: string;
  type: string; // 'Country' | 'Province' | 'Area' | 'SubArea' | 'Commune'
  totalPOS: number;
  totalUsers: number;
  totalSubAreas: number;
  totalCommunes: number;
}

export interface RegionalPerformance {
  visitsThisPeriod: number;
  objectiveRate: number;
  efficiencyRating: string; // 'Excellent' | 'Bon' | 'Moyen' | 'À améliorer'
}

export interface RegionalComparison {
  rankAmongRegions: number;
  performanceVsAverage: number;
  bestMetric: string;
  weakestMetric: string;
}

export interface TopPerformer {
  name: string;
  role: string; // 'ASM' | 'Supervisor' | 'DR' | 'Cyclo'
  visits: number;
  objectiveRate: number;
  specialAchievement: string;
}

export interface Opportunity {
  area: string;
  potential: string;
  estimatedImpact: number;
  effort: string; // 'Faible' | 'Moyen' | 'Élevé'
  timeline: string;
}

export interface Recommendation {
  priority: string; // 'Critique' | 'Haute' | 'Moyenne' | 'Faible'
  action: string;
  expectedROI: string;
  timeline: string;
  responsibleTeam: string;
}

// ======================== DASHBOARD RAPIDE ========================
export interface QuickDashboardResponse {
  lastUpdated: string;
  keyMetrics: QuickMetrics;
  todayStats: TodayStatistics;
  urgentActions: UrgentAction[];
}

export interface QuickMetrics {
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  activeUsersToday: number;
  completionRateToday: number;
  topBrandToday: string;
}

export interface TodayStatistics {
  hourlyVisits: number[]; // 24 éléments pour chaque heure
  peakHour: number;
  activeProvinces: number;
  newPOSVisited: number;
}

export interface UrgentAction {
  priority: string; // 'Critique' | 'Haute' | 'Moyenne'
  description: string;
  deadline: string;
  owner: string;
  impact: string;
}

// ======================== ANALYSE COMPARATIVE ========================
export interface CompetitiveAnalysisResponse {
  currentPeriod: PeriodAnalysis;
  previousPeriod: PeriodAnalysis;
  comparison: ComparisonMetrics;
  trends: TrendAnalysis[];
  insights: CompetitiveInsight[];
}

export interface PeriodAnalysis {
  name: string;
  totalVisits: number;
  completionRate: number;
  uniqueUsersActive: number;
  uniquePOSVisited: number;
  topBrand: string;
  topProvince: string;
  topArea: string;
  topSubArea: string;
  topCommune: string;
  efficiencyScore: number;
}

export interface ComparisonMetrics {
  visitGrowth: number;
  efficiencyChange: number;
  userEngagementChange: number;
  marketExpansion: number;
  overallPerformance: string; // 'Excellente' | 'Bonne' | 'Modérée' | 'À améliorer'
}

export interface TrendAnalysis {
  metric: string;
  direction: string; // 'croissante' | 'décroissante' | 'stable'
  magnitude: number;
  significance: string; // 'très significative' | 'significative' | 'modérée' | 'faible'
  prediction: string;
}

export interface CompetitiveInsight {
  category: string; // 'Performance' | 'Efficacité' | 'Expansion'
  finding: string;
  implication: string;
  actionPlan: string;
  priority: string; // 'Critique' | 'Haute' | 'Moyenne'
}

// ======================== INTERFACES POUR FILTRES ET PARAMÈTRES ========================
export interface SummaryFilters {
  countryUuid: string;
  provinceUuid?: string;
  areaUuid?: string;
  subAreaUuid?: string;
  communeUuid?: string;
  startDate: string;
  endDate: string;
}

export interface CompetitiveFilters {
  countryUuid: string;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
}

// ======================== INTERFACES POUR L'UI ========================
export interface DashboardTab {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  component: string;
}

export interface MetricCard {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  color: string;
  icon: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  data: any[];
  options: any;
  loading: boolean;
}
