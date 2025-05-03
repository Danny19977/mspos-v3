import { Component, computed, OnInit, Renderer2, signal } from '@angular/core';
import { IUser } from '../../user/models/user.model';
import { ICountry } from '../../country/models/country.model';
import { CommonService } from '../../../shared/common/common.service';
import { CountryService } from '../../country/country.service';
import { AuthService } from '../../../auth/auth.service';
import { KpiService } from '../services/kpi.service';
import { routes } from '../../../shared/routes/routes';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: false,
  templateUrl: './kpi-dashboard.component.html',
  styleUrl: './kpi-dashboard.component.scss'
})
export class KpiDashboardComponent {
  public routes = routes;
  base = '';
  page = '';
  last = '';

  isLoading = false;
  currentUser!: IUser;
 
  ndYearList: any[] = [];


  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );
 
  constructor(
    private common: CommonService, 
    private renderer: Renderer2,  
  ) {

    this.common.base.subscribe((base: string) => {
      this.base = base;
    });
    this.common.page.subscribe((page: string) => {
      this.page = page;
    });
    this.common.last.subscribe((last: string) => {
      this.last = last;
    });
    if (this.last == 'nd-dashboard') {
      this.renderer.addClass(document.body, 'date-picker-dashboard');
    }
  } 
  
}
