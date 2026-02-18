/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, signal, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { routes } from '../../../shared/routes/routes';
import { MenuItem, SubMenu, url } from '../../../shared/model/sidebar.model';
import { NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { SidebarService } from '../../../shared/sidebar/sidebar.service';
import { DataService } from '../../../shared/data/data.service';
import { CommonService } from '../../../shared/common/common.service';
import { IUser } from '../../management/user/models/user.model';
import { AuthService } from '../../../auth/auth.service';


@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  // Services avec inject()
  private readonly sidebar = inject(SidebarService);
  private readonly data = inject(DataService);
  private readonly router = inject(Router);
  private readonly common = inject(CommonService);
  private readonly authService = inject(AuthService);

  // Signals pour l'état du composant
  readonly routes = routes;
  readonly base = signal('');
  readonly page = signal('');
  readonly last = signal('');
  readonly currentUrl = signal('');
  readonly currentUser = signal<IUser | null>(null);
  readonly side_bar_data = signal<any[]>([]);
  
  // Signals pour la gestion des menus
  readonly currentOpenSecondMenu = signal<MenuItem | null>(null);
  readonly openMenuItem = signal<MenuItem | null>(null);
  readonly openSubmenuOneItem = signal<SubMenu[] | null>(null);
  readonly multiLevel1 = signal(false);
  readonly multiLevel2 = signal(false);
  readonly multiLevel3 = signal(false);

  constructor() {
    // Observer les événements de navigation
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe((event: RouterEvent) => {
        if (event instanceof NavigationStart) {
          this.getRoutes(event);
          const splitVal = event.url.split('/');
          this.currentUrl.set(event.url);
          this.base.set(splitVal[2]);
          this.page.set(splitVal[3]);
        }
      });
    
    this.getRoutes(this.router);
    
    // Observer les changements de route
    this.common.base
      .pipe(takeUntilDestroyed())
      .subscribe((res: string) => {
        this.base.set(res);
      });
    
    this.common.page
      .pipe(takeUntilDestroyed())
      .subscribe((res: string) => {
        this.page.set(res);
      });
    
    this.common.last
      .pipe(takeUntilDestroyed())
      .subscribe((res: string) => {
        this.last.set(res);
      });
  }

  ngOnInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        if (!navigator.onLine) {
          this.side_bar_data.set(this.data.sidebarOffLine);
        } else {
          if (user.role === 'Manager') {
            this.side_bar_data.set(this.data.sidebarDataManager);
          } else if (user.role === 'ASM') {
            this.side_bar_data.set(this.data.sidebarDataASM);
          } else if (user.role === 'Supervisor') {
            this.side_bar_data.set(this.data.sidebarDataSup);
          } else if (user.role === 'DR') {
            this.side_bar_data.set(this.data.sidebarDataDR);
          } else if (user.role === 'Cyclo') {
            this.side_bar_data.set(this.data.sidebarDataCyclo);
          } else if (user.role === 'Support') {
            this.side_bar_data.set(this.data.sidebarDataSupport);
          } else {
            this.side_bar_data.set([]);
          }
        }
      },
      error: (error) => {
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }

  private getRoutes(route: url): void {
    const splitVal = route.url.split('/');
    this.currentUrl.set(route.url);
    this.base.set(splitVal[2]);
    this.page.set(splitVal[3]);
  }

  public miniSideBarMouseHover(position: string): void {
    if (position === 'over') {
      this.sidebar.expandSideBar.next(true);
    } else {
      this.sidebar.expandSideBar.next(false);
    }
  }

  expandSubMenus(menu: MenuItem): void {
    sessionStorage.setItem('menuValue', menu.menuValue);
    const sideBarData = this.side_bar_data();
    sideBarData.forEach((mainMenus: MenuItem) => {
      mainMenus.menu.forEach((resMenu: SubMenu) => {
        if (resMenu.menuValue === menu.menuValue) {
          menu.showSubRoute = !menu.showSubRoute;
        } else {
          resMenu.showSubRoute = false;
        }
      });
    });
  }

  openMenu(menu: MenuItem): void {
    const sideBarData = this.side_bar_data();
    sideBarData.forEach((mainMenu: any) => {
      if (mainMenu !== menu) {
        mainMenu.menu.forEach((submenu: any) => {
          submenu.showSubRoute = false;
        });
      }
    });
    
    const currentOpen = this.openMenuItem();
    if (currentOpen === menu) {
      this.openMenuItem.set(null);
    } else {
      this.openMenuItem.set(menu);
    }
  }

  openSubmenuOne(subMenus: SubMenu[]): void {
    const currentOpen = this.openSubmenuOneItem();
    if (currentOpen === subMenus) {
      this.openSubmenuOneItem.set(null);
    } else {
      this.openSubmenuOneItem.set(subMenus);
    }
  }

  multiLevelOne() {
    this.multiLevel1.update(value => !value);
  }
  
  multiLevelTwo() {
    this.multiLevel2.update(value => !value);
  }
  
  multiLevelThree() {
    this.multiLevel3.update(value => !value);
  }

}
