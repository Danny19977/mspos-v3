import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../routes/routes';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  private collapseSubject = new BehaviorSubject<boolean>(false);
  collapse$ = this.collapseSubject.asObservable();

  toggleCollapse() {
    this.collapseSubject.next(!this.collapseSubject.value);
  }

  public sidebarDataManager = [
    {
      tittle: 'Main MENU',
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          icon: 'layout-2',
          base: 'dashboard',
          subMenus: [
            // {
            //   menuValue: 'Summary',
            //   route: routes.msposDashboard,
            // },
            {
              menuValue: 'Numeric distribution',
              route: routes.ndDashboard,
            },
            // {
            //   menuValue: 'Weighted distribution',
            //   route: routes.wdDashboard,
            // },
            // {
            //   menuValue: 'Share in shop handling',
            //   route: routes.sishDashboard,
            // },
            {
              menuValue: 'Out of stock',
              route: routes.oosDashboard,
            },
            {
              menuValue: 'Share of stock',
              route: routes.sosDashboard,
            },
            {
              menuValue: 'Sales evolutions',
              route: routes.seDashboard,
            },
            {
              menuValue: 'Maps DR',
              route: routes.googleMapsDashboard,
            },
            {
              menuValue: 'KPI',
              route: routes.kpiDashboard,
            },
          ]
        },
      ],
    },
    {
      tittle: 'Market',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Posforms',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.posFormList,
          base: 'posforms',
          subRoutes: [],
        },
        {
          menuValue: 'RoutePlan',
          base: 'route-plans',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.routeplan,
        },
        {
          menuValue: 'Pos',
          base: 'pos',
          icon: 'home',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.posVente,
        }, 
        {
          menuValue: 'Brands',
          base: 'brands',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.brand,
        }, 
      ],
    },
    {
      tittle: 'Territoires',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Pays',
          base: 'countries',
          icon: 'file-text',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.countryList,
        },
        {
          menuValue: 'Provinces',
          base: 'provinces',
          icon: 'file-text',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.provinceList,
        },
        {
          menuValue: 'Areas',
          base: 'areas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.areaList,
        },
        {
          menuValue: 'SubAreas',
          base: 'subareas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.subareaList,
        },
        {
          menuValue: 'Communes/Secteurs',
          base: 'communes',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.communeList,
        },
      ],
    },
    {
      tittle: 'Teams',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'ASM',
          base: 'asm',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'asm',  
          route: routes.asmList,
        },
        {
          menuValue: 'Superviseurs',
          base: 'supervisors',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.supList,
        },
        {
          menuValue: 'DRs',
          base: 'drs',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.drList,
        },
        {
          menuValue: 'Cyclos',
          base: 'cyclos',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.cycloList,
        },
      ],
    },
    {
      tittle: 'MANAGEMENT',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'Managers',
          base: 'managers',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'managers', 
          route: routes.managerList,
        },
        {
          menuValue: 'Users',
          icon: 'users',
          route: routes.userList,
          hasSubRoute: false,
          showSubRoute: false,
          base: 'users'
        },
        {
          menuValue: 'Activity Users',
          icon: 'bounce-right',
          base: 'users-logs',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.userLogsList,
        },
      ],
    },
  ];

  public sidebarDataASM = [
    {
      tittle: 'Main MENU',
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          icon: 'layout-2',
          base: 'dashboard',
          subMenus: [
            // {
            //   menuValue: 'Summary',
            //   route: routes.msposDashboard,
            // },
            {
              menuValue: 'Numeric distribution',
              route: routes.ndDashboard,
            },
            // {
            //   menuValue: 'Weighted distribution',
            //   route: routes.wdDashboard,
            // },
            // {
            //   menuValue: 'Share in shop handling',
            //   route: routes.sishDashboard,
            // },
            {
              menuValue: 'Out of stock',
              route: routes.oosDashboard,
            },
            {
              menuValue: 'Share of stock',
              route: routes.sosDashboard,
            },
            {
              menuValue: 'Sales evolutions',
              route: routes.seDashboard,
            },
            {
              menuValue: 'Maps DR',
              route: routes.googleMapsDashboard,
            },
            {
              menuValue: 'KPI',
              route: routes.kpiDashboard,
            },
          ]
        },
      ],
    },
    {
      tittle: 'Market',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Posforms',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.posFormList,
          base: 'posforms',
          subRoutes: [],
        },
        {
          menuValue: 'RoutePlan',
          base: 'route-plans',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.routeplan,
        },
        {
          menuValue: 'Pos',
          base: 'pos',
          icon: 'home',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.posVente,
        }, 
        {
          menuValue: 'Brands',
          base: 'brands',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.brand,
        }, 
      ],
    },
    {
      tittle: 'Territoires',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Provinces',
          base: 'provinces',
          icon: 'file-text',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.provinceList,
        },
        {
          menuValue: 'Areas',
          base: 'areas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.areaList,
        },
        {
          menuValue: 'SubAreas',
          base: 'subareas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.subareaList,
        },
        {
          menuValue: 'Communes/Secteurs',
          base: 'communes',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.communeList,
        },
      ],
    },
    {
      tittle: 'Teams',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'ASM',
          base: 'asm',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'asm',  
          route: routes.asmList,
        },
        {
          menuValue: 'Superviseurs',
          base: 'supervisors',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.supList,
        },
        {
          menuValue: 'DRs',
          base: 'drs',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.drList,
        },
        {
          menuValue: 'Cyclos',
          base: 'cyclos',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.cycloList,
        },
      ],
    }, 
  ];

  public sidebarDataSup = [
    {
      tittle: 'Main MENU',
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          icon: 'layout-2',
          base: 'dashboard',
          subMenus: [
            // {
            //   menuValue: 'Summary',
            //   route: routes.msposDashboard,
            // },
            {
              menuValue: 'Numeric distribution',
              route: routes.ndDashboard,
            },
            // {
            //   menuValue: 'Weighted distribution',
            //   route: routes.wdDashboard,
            // },
            // {
            //   menuValue: 'Share in shop handling',
            //   route: routes.sishDashboard,
            // },
            {
              menuValue: 'Out of stock',
              route: routes.oosDashboard,
            },
            {
              menuValue: 'Share of stock',
              route: routes.sosDashboard,
            },
            {
              menuValue: 'Sales evolutions',
              route: routes.seDashboard,
            },
            {
              menuValue: 'Maps DR',
              route: routes.googleMapsDashboard,
            },
            {
              menuValue: 'KPI',
              route: routes.kpiDashboard,
            },
          ]
        },
      ],
    },
    {
      tittle: 'Market',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Posforms',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.posFormList,
          base: 'posforms',
          subRoutes: [],
        },
        {
          menuValue: 'RoutePlan',
          base: 'route-plans',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.routeplan,
        },
        {
          menuValue: 'Pos',
          base: 'pos',
          icon: 'home',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.posVente,
        },
      ],
    },
    {
      tittle: 'Territoires',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'Areas',
          base: 'areas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.areaList,
        },
        {
          menuValue: 'SubAreas',
          base: 'subareas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.subareaList,
        },
        {
          menuValue: 'Communes/Secteurs',
          base: 'communes',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.communeList,
        },
      ],
    },
    {
      tittle: 'Teams',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Superviseurs',
          base: 'supervisors',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.supList,
        },
        {
          menuValue: 'DRs',
          base: 'drs',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.drList,
        },
        {
          menuValue: 'Cyclos',
          base: 'cyclos',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.cycloList,
        },
      ],
    }, 
  ];

  public sidebarDataDR = [
    {
      tittle: 'Market',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Posforms',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.posFormList,
          base: 'posforms',
          subRoutes: [],
        },
        {
          menuValue: 'RoutePlan',
          base: 'route-plans',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.routeplan,
        },
        {
          menuValue: 'Pos',
          base: 'pos',
          icon: 'home',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.posVente,
        },
      ],
    },
    {
      tittle: 'Territoires',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'SubAreas',
          base: 'subareas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.subareaList,
        },
        {
          menuValue: 'Communes/Secteurs',
          base: 'communes',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.communeList,
        },
      ],
    },
    {
      tittle: 'Teams',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'DRs',
          base: 'drs',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.drList,
        },
        {
          menuValue: 'Cyclos',
          base: 'cyclos',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.cycloList,
        },
      ],
    }, 
  ];

  public sidebarDataCyclo = [
    {
      tittle: 'Market',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Posforms',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.posFormList,
          base: 'posforms',
          subRoutes: [],
        },
        {
          menuValue: 'RoutePlan',
          base: 'route-plans',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.routeplan,
        },
        {
          menuValue: 'Pos',
          base: 'pos',
          icon: 'home',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.posVente,
        },
      ],
    },
    {
      tittle: 'Territoires',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'Communes/Secteurs',
          base: 'communes',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.communeList,
        },
      ],
    },
    {
      tittle: 'Teams',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'Cyclos',
          base: 'cyclos',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.cycloList,
        },
      ],
    }, 
  ];

  public sidebarDataSupport = [
    {
      tittle: 'Main MENU',
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          icon: 'layout-2',
          base: 'dashboard',
          subMenus: [
            // {
            //   menuValue: 'Summary',
            //   route: routes.msposDashboard,
            // },
            {
              menuValue: 'Numeric distribution',
              route: routes.ndDashboard,
            },
            // {
            //   menuValue: 'Weighted distribution',
            //   route: routes.wdDashboard,
            // },
            // {
            //   menuValue: 'Share in shop handling',
            //   route: routes.sishDashboard,
            // },
            {
              menuValue: 'Out of stock',
              route: routes.oosDashboard,
            },
            {
              menuValue: 'Share of stock',
              route: routes.sosDashboard,
            },
            {
              menuValue: 'Sales evolutions',
              route: routes.seDashboard,
            },
            {
              menuValue: 'Maps DR',
              route: routes.googleMapsDashboard,
            },
            {
              menuValue: 'KPI',
              route: routes.kpiDashboard,
            },
          ]
        },
      ],
    },
    {
      tittle: 'Market',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Posforms',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.posFormList,
          base: 'posforms',
          subRoutes: [],
        },
        {
          menuValue: 'RoutePlan',
          base: 'route-plans',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.routeplan,
        },
        {
          menuValue: 'Pos',
          base: 'pos',
          icon: 'home',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.posVente,
        }, 
        {
          menuValue: 'Brands',
          base: 'brands',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.brand,
        }, 
      ],
    },
    {
      tittle: 'Territoires',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Pays',
          base: 'countries',
          icon: 'file-text',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.countryList,
        },
        {
          menuValue: 'Provinces',
          base: 'provinces',
          icon: 'file-text',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.provinceList,
        },
        {
          menuValue: 'Areas',
          base: 'areas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.areaList,
        },
        {
          menuValue: 'SubAreas',
          base: 'subareas',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.subareaList,
        },
        {
          menuValue: 'Communes/Secteurs',
          base: 'communes',
          icon: 'page-break',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.communeList,
        },
      ],
    },
    {
      tittle: 'Teams',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'ASM',
          base: 'asm',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'asm',  
          route: routes.asmList,
        },
        {
          menuValue: 'Superviseurs',
          base: 'supervisors',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.supList,
        },
        {
          menuValue: 'DRs',
          base: 'drs',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'superviseurs', 
          route: routes.drList,
        },
        {
          menuValue: 'Cyclos',
          base: 'cyclos',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.cycloList,
        },
      ],
    },
    {
      tittle: 'MANAGEMENT',
      showAsTab: true,
      separateRoute: false,
      menu: [ 
        {
          menuValue: 'Managers',
          base: 'managers',
          icon: 'users',
          hasSubRoute: false,
          showSubRoute: false,
          // base1: 'managers', 
          route: routes.managerList,
        },
        {
          menuValue: 'Users',
          icon: 'users',
          route: routes.userList,
          hasSubRoute: false,
          showSubRoute: false,
          base: 'users'
        },
        {
          menuValue: 'Activity Users',
          icon: 'bounce-right',
          base: 'users-logs',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.userLogsList,
        },
      ],
    },
  ];
 
  public sidebarOffLine = [
    {
      tittle: 'Market',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Posforms',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.posFormList,
          base: 'posforms',
          subRoutes: [],
        },
        {
          menuValue: 'RoutePlan',
          base: 'route-plans',
          icon: 'list-check',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.routeplan,
        },
        {
          menuValue: 'Pos',
          base: 'pos',
          icon: 'home',
          hasSubRoute: false,
          showSubRoute: false, 
          route: routes.posVente,
        },
      ],
    },
  ];
}
