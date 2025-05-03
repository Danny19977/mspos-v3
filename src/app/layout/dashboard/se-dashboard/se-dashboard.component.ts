import { Component, computed, OnInit, Renderer2, signal } from '@angular/core';
import { routes } from '../../../shared/routes/routes';
import { IUser } from '../../user/models/user.model';
import { ICountry } from '../../country/models/country.model';
import { CommonService } from '../../../shared/common/common.service';

@Component({
  selector: 'app-se-dashboard',
  standalone: false,
  templateUrl: './se-dashboard.component.html',
  styleUrl: './se-dashboard.component.scss'
})
export class SeDashboardComponent {
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
