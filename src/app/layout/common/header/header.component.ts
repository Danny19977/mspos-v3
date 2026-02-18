import { Component, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { SidebarService } from '../../../shared/sidebar/sidebar.service';
import { CommonService } from '../../../shared/common/common.service';
import { routes } from '../../../shared/routes/routes';
import { SettingsService } from '../../../shared/settings/settings.service'; 
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';
import { LogsService } from '../../management/user-logs/logs.service';
import { IUser } from '../../management/user/models/user.model';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  // Services avec inject()
  private readonly common = inject(CommonService);
  private readonly router = inject(Router);
  private readonly sidebar = inject(SidebarService);
  private readonly settings = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly logActivity = inject(LogsService);
  private readonly location = inject(Location);

  // Signals pour l'état du composant
  readonly base = signal('');
  readonly page = signal('');
  readonly last = signal('');
  readonly themeMode = signal('light_mode');
  readonly miniSidebar = signal(false);
  readonly routes = routes;
  readonly currentUser = signal<IUser | null>(null);
  readonly isLoading = signal(false);
  readonly onLine = signal(navigator.onLine);

  constructor() {
    // Observer les changements de route
    this.common.base
      .pipe(takeUntilDestroyed())
      .subscribe((base: string) => {
        this.base.set(base);
      });
    
    this.common.page
      .pipe(takeUntilDestroyed())
      .subscribe((page: string) => {
        this.page.set(page);
      });
    
    this.common.last
      .pipe(takeUntilDestroyed())
      .subscribe((last: string) => {
        this.last.set(last);
      });
    
    // Observer la position de la sidebar
    this.sidebar.sideBarPosition
      .pipe(takeUntilDestroyed())
      .subscribe((res: string) => {
        this.miniSidebar.set(res === 'true');
      });
    
    // Observer le theme mode
    this.settings.themeMode
      .pipe(takeUntilDestroyed())
      .subscribe((res: string) => {
        this.themeMode.set(res);
      });
  }

  ngOnInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (error) => { 
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }


  logout() {
    const user = this.currentUser();
    if (!user) return;
    
    this.isLoading.set(true);
    this.logActivity.activity(
      'Auth',
      user.uuid,
      'logout',
      'Logout Auth',
      user.fullname
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.authService.logout()
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isLoading.set(false); 
        console.log(err);
      }
    });
  }


  public toggleSidebar(): void {
    this.sidebar.switchSideMenuPosition();
  }

  public togglesMobileSideBar(): void {
    this.sidebar.switchMobileSideBarPosition();
  }

  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sidebar.expandSideBar.next(true);
    } else {
      this.sidebar.expandSideBar.next(false);
    }
  }
  public changeThemeMode(theme: string): void {
    this.settings.themeMode.next(theme);
    localStorage.setItem('themeMode', theme);
  }

  goBack() {
    this.location.back();
  }

}
