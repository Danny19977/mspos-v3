import { 
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { routes } from '../../../shared/routes/routes';
import { SettingsService } from '../../../shared/settings/settings.service';

@Component({
  selector: 'app-layout-common',
  standalone: false,
  templateUrl: './layout-common.component.html',
  styleUrl: './layout-common.component.scss'
})
export class LayoutCommonComponent {
  public routes = routes;
  public showDark = false;
  themeMode = 'light_mode';
  layoutMode = 'light_mode';
  navigationColor = 'light_mode';
  fontColor = 'red_font_color';


  constructor(private settings: SettingsService, private router: Router) {
    this.settings.themeMode.subscribe((res: string) => {
      this.themeMode = res;
    });
    this.settings.layoutMode.subscribe((res: string) => {
      this.layoutMode = res;
    });
    this.settings.navigationColor.subscribe((res: string) => {
      this.navigationColor = res;
    });
    this.settings.fontColor.subscribe((res: string) => {
      this.fontColor = res;
    });
  }

  public changeThemeMode(theme: string): void {
    this.settings.themeMode.next(theme);
    localStorage.setItem('themeMode', theme);
  }
  public changeLayoutMode(layout: string): void {
    this.settings.layoutMode.next(layout);
    localStorage.setItem('layoutMode', layout);
  }
  public changeNavigationColor(color: string): void {
    this.settings.navigationColor.next(color);
    localStorage.setItem('navigationColor', color);
  }
  public changeFontColor(color: string): void {
    this.settings.fontColor.next(color);
    localStorage.setItem('fontColor', color);
  }

  resetAllMode() {
    this.settings.changeThemeMode('light_mode');
    this.settings.changeLayoutMode('default_mode');
    this.settings.changeNavigationColor('light_mode');
    this.settings.changeFontColor('red_font_color');
  }

  @Output() previewToggled: EventEmitter<boolean> = new EventEmitter<boolean>();
  showPreview = false;

  togglePreview(): void {
    this.showPreview = !this.showPreview;
    this.previewToggled.emit(this.showPreview);
  }
}
