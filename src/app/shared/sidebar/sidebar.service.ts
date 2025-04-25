import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ 
  providedIn: 'root',
})
export class SidebarService {
  private collapseSubject = new BehaviorSubject<boolean>(false);
  collapse$ = this.collapseSubject.asObservable();

  toggleCollapse() {
    this.collapseSubject.next(!this.collapseSubject.value);
  }

  public sideBarPosition: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('sideBarPosition') || 'false'
  );

  public toggleMobileSideBar: BehaviorSubject<string> =
    new BehaviorSubject<string>(
      localStorage.getItem('isMobileSidebar') || 'false'
    );

  public expandSideBar: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  public switchSideMenuPosition(): void {
    if (localStorage.getItem('sideBarPosition')) {
      this.sideBarPosition.next('false');
      this.expandSideBar.next(true);
      localStorage.removeItem('sideBarPosition');
    } else {
      this.sideBarPosition.next('true');
      this.expandSideBar.next(false);
      localStorage.setItem('sideBarPosition', 'true');
    }
  }

  public switchMobileSideBarPosition(): void {
    if (localStorage.getItem('isMobileSidebar')) {
      this.toggleMobileSideBar.next('false');
      localStorage.removeItem('isMobileSidebar');
    } else {
      this.toggleMobileSideBar.next('true');
      localStorage.setItem('isMobileSidebar', 'true');
    }
  }
  public showDark: BehaviorSubject<string | boolean> = new BehaviorSubject<string | boolean>(
    localStorage.getItem('isDarkTheme') || false
  );
  public themeColor(): void {
    if (localStorage.getItem('isDarkTheme')) {
      this.showDark.next("false");
      localStorage.removeItem('isDarkTheme');
    } else {
      this.showDark.next('true');
      localStorage.setItem('isDarkTheme', 'true');
    }
  }


}
