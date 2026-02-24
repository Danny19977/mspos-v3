// ── Filter types ──────────────────────────────────────────────────────────────

export interface SummaryFilters {
  countryUuid: string;
  startDate: string;
  endDate: string;
  provinceUuid?: string;
  areaUuid?: string;
  subAreaUuid?: string;
  communeUuid?: string;
}

export interface CompetitiveFilters {
  countryUuid: string;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
}

// ── Generic API wrapper ────────────────────────────────────────────────────────

export interface ApiSummaryResponse<T> {
  status: string;
  message: string;
  data: T;
}

// ── Executive Summary ──────────────────────────────────────────────────────────

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
  visitTrend: string;
  monthlyGrowth: number;
  predictedNextMonth: number;
}

export interface ExecutiveSummaryResponse {
  overview: OverviewMetrics;
  performance: PerformanceMetrics;
  geographicDistribution: GeographicMetrics;
  teamPerformance: TeamPerformanceMetrics;
  trendAnalysis: TrendMetrics;
}

// ── Regional Summary ───────────────────────────────────────────────────────────

export interface RegionalInfo {
  name: string;
  type: string;
  totalPOS: number;
  totalUsers: number;
  totalSubAreas: number;
  totalCommunes: number;
}

export interface RegionalPerformance {
  visitsThisPeriod: number;
  objectiveRate: number;
  efficiencyRating: string;
}

export interface RegionalComparison {
  rankAmongRegions: number;
  performanceVsAverage: number;
  bestMetric: string;
  weakestMetric: string;
}

export interface TopPerformer {
  name: string;
  role: string;
  visits: number;
  objectiveRate: number;
  specialAchievement: string;
}

export interface Opportunity {
  area: string;
  potential: string;
  estimatedImpact: number;
  effort: string;
  timeline: string;
}

export interface Recommendation {
  priority: string;
  action: string;
  expectedROI: string;
  timeline: string;
  responsibleTeam: string;
}

export interface RegionalSummaryResponse {
  regionInfo: RegionalInfo;
  performance: RegionalPerformance;
  comparison: RegionalComparison;
  topPerformers: TopPerformer[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
}

// ── Quick Dashboard ────────────────────────────────────────────────────────────

export interface QuickMetrics {
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  activeUsersToday: number;
  completionRateToday: number;
  topBrandToday: string;
}

export interface TodayStats {
  hourlyVisits: number[];
  peakHour: number;
  activeProvinces: number;
  newPOSVisited: number;
}

export interface UrgentAction {
  priority: string;
  description: string;
  deadline: string;
  owner: string;
  impact: string;
}

export interface QuickDashboardResponse {
  lastUpdated: string;
  keyMetrics: QuickMetrics;
  todayStats: TodayStats;
  urgentActions: UrgentAction[];
}

// ── Competitive Analysis ───────────────────────────────────────────────────────

export interface PeriodMetrics {
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

export interface PeriodComparison {
  visitGrowth: number;
  efficiencyChange: number;
  userEngagementChange: number;
  marketExpansion: number;
  overallPerformance: string;
}

export interface TrendItem {
  metric: string;
  direction: string;
  magnitude: number;
  significance: string;
  prediction: string;
}

export interface Insight {
  category: string;
  finding: string;
  implication: string;
  actionPlan: string;
  priority: string;
}

export interface CompetitiveAnalysisResponse {
  currentPeriod: PeriodMetrics;
  previousPeriod: PeriodMetrics;
  comparison: PeriodComparison;
  trends: TrendItem[];
  insights: Insight[];
}
