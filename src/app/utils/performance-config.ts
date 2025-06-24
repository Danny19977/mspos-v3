/**
 * Configuration des optimisations de performance pour Angular
 * Mise en place du lazy loading et des stratégies d'optimisation
 */

export const PERFORMANCE_CONFIG = {
  // Configuration du lazy loading
  lazyLoading: {
    enabled: true,
    preloadStrategy: 'selective', // 'none' | 'all' | 'selective'
    preloadDelay: 2000, // Délai avant le preload (ms)
  },

  // Configuration des services
  services: {
    // Services essentiels chargés au démarrage
    core: [
      'AuthService'
    ],
    // Services chargés avec les modules
    lazy: [
      'GoogleMapService',
      'KpiService', 
      'NdService',
      'SaleEvolutionService',
      'SosService',
      'SummaryService',
      'AsmService',
      'BrandService',
      'CommuneService',
      'CountryService',
      'CycloService',
      'DrService',
      'ManagerService',
      'PosVenteService',
      'PosformService',
      'RouteplanService',
      'RouteplanItemService',
      'SubareaService',
      'SupService',
      'UserService',
      'LogsService'
    ]
  },

  // Modules organisés par fonctionnalité
  modules: {
    core: [
      'AppModule',
      'AuthModule',
      'SharedModule'
    ],
    lazy: [
      'LayoutModule',
      'DashboardModule',
      'TerritoriesModule',
      'TeamsModule',
      'MarketModule', 
      'ManagementModule',
      'PagesModule',
      'ErrorPagesModule'
    ]
  }
};

export const OPTIMIZATION_TIPS = [
  'Les modules sont maintenant chargés à la demande (lazy loading)',
  'Les services ne sont chargés qu\'avec leurs modules respectifs',
  'Utilisation d\'une stratégie de preloading sélective',
  'Réduction du bundle initial pour un démarrage plus rapide',
  'Organisation modulaire pour une meilleure maintenabilité'
];
