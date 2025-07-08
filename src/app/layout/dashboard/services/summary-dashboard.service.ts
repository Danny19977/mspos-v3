import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';
import { 
  ExecutiveSummaryResponse, 
  RegionalSummaryResponse, 
  QuickDashboardResponse, 
  CompetitiveAnalysisResponse,
  ApiSummaryResponse,
  SummaryFilters,
  CompetitiveFilters
} from '../models/summary-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class SummaryDashboardService extends ApiService {
  endpoint: string = `${environment.apiUrl}/dashboard/summary`;

  /**
   * Récupère le résumé exécutif global
   * @param filters Filtres pour la requête
   * @returns Observable contenant les métriques exécutives
   */
  getExecutiveSummary(filters: SummaryFilters): Observable<ApiSummaryResponse<ExecutiveSummaryResponse>> {
    const params = new URLSearchParams({
      country_uuid: filters.countryUuid,
      start_date: filters.startDate,
      end_date: filters.endDate
    });

    return this.http.get<ApiSummaryResponse<ExecutiveSummaryResponse>>(
      `${this.endpoint}/executive?${params.toString()}`
    ).pipe(
      catchError((error) => {
        console.warn('API endpoint not available, using mock data:', error);
        return of(this.createMockExecutiveSummary());
      })
    );
  }

  /**
   * Récupère le résumé régional focalisé sur une région spécifique
   * @param filters Filtres pour la requête régionale
   * @returns Observable contenant le résumé régional
   */
  getRegionalSummary(filters: SummaryFilters): Observable<ApiSummaryResponse<RegionalSummaryResponse>> {
    const params = new URLSearchParams({
      country_uuid: filters.countryUuid,
      start_date: filters.startDate,
      end_date: filters.endDate
    });

    if (filters.provinceUuid) params.append('province_uuid', filters.provinceUuid);
    if (filters.areaUuid) params.append('area_uuid', filters.areaUuid);
    if (filters.subAreaUuid) params.append('sub_area_uuid', filters.subAreaUuid);
    if (filters.communeUuid) params.append('commune_uuid', filters.communeUuid);

    return this.http.get<ApiSummaryResponse<RegionalSummaryResponse>>(
      `${this.endpoint}/regional?${params.toString()}`
    ).pipe(
      catchError((error) => {
        console.warn('API endpoint not available, using mock data:', error);
        return of(this.createMockRegionalSummary());
      })
    );
  }

  /**
   * Récupère le dashboard rapide pour les décisions urgentes
   * @param countryUuid UUID du pays
   * @returns Observable contenant les métriques rapides
   */
  getQuickDashboard(countryUuid: string): Observable<ApiSummaryResponse<QuickDashboardResponse>> {
    const params = new URLSearchParams({
      country_uuid: countryUuid
    });

    return this.http.get<ApiSummaryResponse<QuickDashboardResponse>>(
      `${this.endpoint}/quick?${params.toString()}`
    ).pipe(
      catchError((error) => {
        console.warn('API endpoint not available, using mock data:', error);
        return of(this.createMockQuickDashboard());
      })
    );
  }

  /**
   * Récupère l'analyse comparative entre deux périodes
   * @param filters Filtres pour l'analyse comparative
   * @returns Observable contenant l'analyse comparative
   */
  getCompetitiveAnalysis(filters: CompetitiveFilters): Observable<ApiSummaryResponse<CompetitiveAnalysisResponse>> {
    const params = new URLSearchParams({
      country_uuid: filters.countryUuid,
      current_start: filters.currentStart,
      current_end: filters.currentEnd,
      previous_start: filters.previousStart,
      previous_end: filters.previousEnd
    });

    return this.http.get<ApiSummaryResponse<CompetitiveAnalysisResponse>>(
      `${this.endpoint}/competitive?${params.toString()}`
    ).pipe(
      catchError((error) => {
        console.warn('API endpoint not available, using mock data:', error);
        return of(this.createMockCompetitiveAnalysis());
      })
    );
  }

  // ======================== MÉTHODES MOCK POUR LES TESTS ========================

  private createMockExecutiveSummary(): ApiSummaryResponse<ExecutiveSummaryResponse> {
    return {
      status: 'success',
      message: 'Données de démonstration - API en cours de développement',
      data: {
        overview: {
          totalPOS: 1250,
          activePOS: 875,
          totalVisits: 2340,
          totalUsers: 156,
          totalProvinces: 8,
          totalAreas: 24,
          marketPenetration: 70.0,
          averageVisitsPerDay: 78.0
        },
        performance: {
          visitObjectiveRate: 85.5,
          completionRate: 92.3,
          efficiencyScore: 88.9,
          topBrandPerformance: 'Coca-Cola',
          averageFormScore: 450.0
        },
        geographicDistribution: {
          topPerformingProvince: 'Kinshasa',
          topPerformingArea: 'Centre',
          topPerformingSubArea: 'Gombe',
          topPerformingCommune: 'Kinshasa',
          coveragePercentage: 75.5
        },
        teamPerformance: {
          totalTeamMembers: 156,
          activeTeamMembers: 134,
          topPerformer: 'Jean Mukendi',
          averageTeamEfficiency: 85.9
        },
        trendAnalysis: {
          visitTrend: 'croissante',
          monthlyGrowth: 12.5,
          predictedNextMonth: 2750.0
        }
      }
    };
  }

  private createMockRegionalSummary(): ApiSummaryResponse<RegionalSummaryResponse> {
    return {
      status: 'success',
      message: 'Données de démonstration - API en cours de développement',
      data: {
        regionInfo: {
          name: 'Kinshasa',
          type: 'Province',
          totalPOS: 340,
          totalUsers: 45,
          totalSubAreas: 6,
          totalCommunes: 24
        },
        performance: {
          visitsThisPeriod: 450,
          objectiveRate: 87.3,
          efficiencyRating: 'Bon'
        },
        comparison: {
          rankAmongRegions: 2,
          performanceVsAverage: 15.8,
          bestMetric: 'Taux de visite',
          weakestMetric: 'Completion rate'
        },
        topPerformers: [
          {
            name: 'Marie Kabila',
            role: 'DR',
            visits: 45,
            objectiveRate: 112.5,
            specialAchievement: 'Objectif dépassé'
          },
          {
            name: 'Joseph Mukendi',
            role: 'Supervisor',
            visits: 38,
            objectiveRate: 95.0,
            specialAchievement: 'Performance excellente'
          }
        ],
        opportunities: [
          {
            area: 'Performance des visites',
            potential: 'Amélioration du taux d\'objectif',
            estimatedImpact: 25.0,
            effort: 'Moyen',
            timeline: '3 mois'
          }
        ],
        recommendations: [
          {
            priority: 'Haute',
            action: 'Améliorer la formation des équipes',
            expectedROI: '150%',
            timeline: '3 mois',
            responsibleTeam: 'Management régional'
          }
        ]
      }
    };
  }

  private createMockQuickDashboard(): ApiSummaryResponse<QuickDashboardResponse> {
    return {
      status: 'success',
      message: 'Données de démonstration - API en cours de développement',
      data: {
        lastUpdated: new Date().toLocaleString('fr-FR'),
        keyMetrics: {
          visitsToday: 45,
          visitsThisWeek: 234,
          visitsThisMonth: 1234,
          activeUsersToday: 23,
          completionRateToday: 87.5,
          topBrandToday: 'Coca-Cola'
        },
        todayStats: {
          hourlyVisits: [0, 0, 0, 0, 0, 2, 5, 8, 12, 15, 18, 20, 22, 18, 15, 12, 10, 8, 5, 3, 2, 1, 0, 0],
          peakHour: 13,
          activeProvinces: 6,
          newPOSVisited: 12
        },
        urgentActions: [
          {
            priority: 'Haute',
            description: 'Taux de completion en baisse dans la région Sud',
            deadline: '24 heures',
            owner: 'Équipes terrain',
            impact: 'Qualité des données compromise'
          }
        ]
      }
    };
  }

  private createMockCompetitiveAnalysis(): ApiSummaryResponse<CompetitiveAnalysisResponse> {
    return {
      status: 'success',
      message: 'Données de démonstration - API en cours de développement',
      data: {
        currentPeriod: {
          name: 'Période actuelle',
          totalVisits: 2340,
          completionRate: 87.5,
          uniqueUsersActive: 134,
          uniquePOSVisited: 875,
          topBrand: 'Coca-Cola',
          topProvince: 'Kinshasa',
          topArea: 'Centre',
          topSubArea: 'Gombe',
          topCommune: 'Kinshasa',
          efficiencyScore: 88.9
        },
        previousPeriod: {
          name: 'Période précédente',
          totalVisits: 2100,
          completionRate: 82.3,
          uniqueUsersActive: 128,
          uniquePOSVisited: 820,
          topBrand: 'Pepsi',
          topProvince: 'Katanga',
          topArea: 'Nord',
          topSubArea: 'Lubumbashi',
          topCommune: 'Lubumbashi',
          efficiencyScore: 84.2
        },
        comparison: {
          visitGrowth: 11.4,
          efficiencyChange: 5.6,
          userEngagementChange: 4.7,
          marketExpansion: 6.7,
          overallPerformance: 'Bonne'
        },
        trends: [
          {
            metric: 'Visites',
            direction: 'croissante',
            magnitude: 11.4,
            significance: 'significative',
            prediction: 'Forte progression attendue pour visites'
          }
        ],
        insights: [
          {
            category: 'Performance',
            finding: 'Croissance significative des visites (+11%)',
            implication: 'Momentum positif, équipes motivées',
            actionPlan: 'Maintenir la dynamique, analyser les facteurs de succès',
            priority: 'Moyenne'
          }
        ]
      }
    };
  }

  // ======================== MÉTHODES UTILITAIRES ========================

  /**
   * Formate une date au format YYYY-MM-DD
   * @param date Date à formater
   * @returns Chaîne formatée
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Génère des paramètres de requête par défaut pour l'utilisateur actuel
   * @param userCountryUuid UUID du pays de l'utilisateur
   * @returns Objet avec les paramètres par défaut
   */
  getDefaultFilters(userCountryUuid: string): SummaryFilters {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return {
      countryUuid: userCountryUuid,
      startDate: this.formatDate(startOfMonth),
      endDate: this.formatDate(today)
    };
  }

  /**
   * Génère des filtres pour l'analyse comparative (mois actuel vs mois précédent)
   * @param userCountryUuid UUID du pays de l'utilisateur
   * @returns Objet avec les filtres pour l'analyse comparative
   */
  getDefaultCompetitiveFilters(userCountryUuid: string): CompetitiveFilters {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = today;
    
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      countryUuid: userCountryUuid,
      currentStart: this.formatDate(currentMonthStart),
      currentEnd: this.formatDate(currentMonthEnd),
      previousStart: this.formatDate(previousMonthStart),
      previousEnd: this.formatDate(previousMonthEnd)
    };
  }
}
