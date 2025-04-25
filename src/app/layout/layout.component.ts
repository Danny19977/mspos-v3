import { Component, OnInit, Renderer2 } from '@angular/core';
import { SidebarService } from '../shared/sidebar/sidebar.service';
import {
  NavigationStart,
  Router,
  Event as RouterEvent,
  NavigationEnd,
} from '@angular/router';
import { url } from '../shared/model/sidebar.model';
import { CommonService } from '../shared/common/common.service';
import { DataService } from '../shared/data/data.service';
import { SettingsService } from '../shared/settings/settings.service';
 
import { AuthService } from '../auth/auth.service';
import { Auth } from '../auth/classes/auth';
import { routes } from '../shared/routes/routes';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  public routes = routes;
  public miniSidebar = false;
  public expandMenu = false;
  public mobileSidebar = false;
  public sideBarActivePath = false;
  public themeMode = '';
  public navigationColor = '';
  public layoutMode = '';
  public fontColor = '';


  base = '';
  page = '';
  last = '';

  constructor(
    private Router: Router,
    private sidebar: SidebarService,
    private common: CommonService,
    private data: DataService,
    private settings: SettingsService,
    private renderer: Renderer2, 
    private router: Router, 
    private authService: AuthService,
  ) {
    this.sidebar.toggleMobileSideBar.subscribe((res: string) => {
      if (res == 'true' || res == 'true') {
        this.mobileSidebar = true;
      } else {
        this.mobileSidebar = false;
      }
    });
    this.sidebar.expandSideBar.subscribe((res: boolean) => {
      this.expandMenu = res;
    });
    this.sidebar.sideBarPosition.subscribe((res: string) => {
      if (res == 'true') {
        this.miniSidebar = true;
      } else {
        this.miniSidebar = false;
      }
    });
    this.Router.events.subscribe((data: RouterEvent) => {
      if (data instanceof NavigationStart) {
        this.getRoutes(data);
      }
      if (data instanceof NavigationEnd) {
        localStorage.removeItem('isMobileSidebar');
        this.mobileSidebar = false;
      }
    });
    this.settings.themeMode.subscribe((mode) => {
      this.themeMode = mode;
    });
    this.settings.navigationColor.subscribe((color) => {
      this.navigationColor = color;
    });
    this.settings.layoutMode.subscribe((layout) => {
      this.layoutMode = layout;
    });
    this.settings.fontColor.subscribe((color) => {
      this.fontColor = color;
    });
    this.settings.themeMode.subscribe((res: string) => {
      if (res == 'dark_mode') {
        this.renderer.addClass(document.body, 'dark-select');
      } else {
        this.renderer.removeClass(document.body, 'dark-select');
      }
    });
    this.getRoutes(this.Router);

   
    
  }

  private getRoutes(data: url): void {
    const splitVal = data.url.split('/');
    // console.log("splitVal", splitVal)
    this.base = splitVal[1];
    this.page = splitVal[2];
    this.last = splitVal[3];
    this.common.base.next(splitVal[1]);
    this.common.page.next(splitVal[2]);
    this.common.last.next(splitVal[3]);

    // console.log("base", this.base)
    // console.log("page", this.page)
    // console.log("last", this.last)

    if (data.url.split('/')[1] === '404-error') {
      this.sideBarActivePath = true;
    } else {
      this.sideBarActivePath = false;
    }
   
  }
  isCollapsed = false;

  ngOnInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        // Auth.userEmitter.emit(user); 
        this.data.collapse$.subscribe((collapse: boolean) => {
          this.isCollapsed = collapse;
        });
    
        this.Router.events.subscribe((event) => {
          if (event instanceof NavigationStart) {
            const url = event.url;
            if (
              url.includes('mspos-dashboard'),
              url.includes('numeric-distribution'),
              url.includes('weighted-distribution'),
              url.includes('share-in-shop-handling'),
              url.includes('out-of-stock'),
              url.includes('share-of-stock'),

              url.includes('pos-form-list'),
              url.includes('user-list'),
              url.includes('province-list'),
              url.includes('ares-list'),
              url.includes('sup-list'),
              url.includes('asm-list'),
              url.includes('manager-list'),
              url.includes('activity')
            ) {
              this.showPreloader = true;
              setTimeout(() => {
                this.showPreloader = false;
              }, 2000);
            }
          }
        });
      },
      error: (error) => {
        // this.routes.login;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
   
  }

  showPreloader = false;
}
