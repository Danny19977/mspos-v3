import { Component, computed, OnInit, Renderer2, signal } from '@angular/core';
import { routes } from '../../../shared/routes/routes'; 
import { CommonService } from '../../../shared/common/common.service'; 
import { AuthService } from '../../../auth/auth.service'; 
import { IUser } from '../../user/models/user.model';
import { ICountry } from '../../country/models/country.model';
import { CountryService } from '../../country/country.service';
import { NdService } from '../services/nd.service';
import { SosService } from '../services/sos.service';
import { SOSYearModel } from '../models/nd-dashboard.models';

@Component({
  selector: 'app-sos-dashboard',
  standalone: false,
  templateUrl: './sos-dashboard.component.html',
  styleUrl: './sos-dashboard.component.scss'
})
export class SosDashboardComponent implements OnInit {
 public routes = routes;
  base = '';
  page = '';
  last = '';

  isLoading = false;
  currentUser!: IUser;
 
  ndYearList: SOSYearModel[] = [];


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
    private sosService: SosService,
    private countryService: CountryService, 
    private authService: AuthService,
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


  ngOnInit(): void {
    this.isLoading = true; 
 
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;

        this.countryService.getAll().subscribe((res) => {
          this.countryList.set(res.data); 
          if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') { 
            this.getChartLineYear(this.countryList()[0].uuid);
          } else { 
            this.getChartLineYear(this.currentUser.country_uuid);
          }
        }); 

      },
      error: (error) => {
        console.log(error);
      }
    });
 
  }
 
  getChartLineYear(country_uuid: string) {
    const year = new Date().getFullYear();
    this.sosService.SOSTotalByBrandByMonth(country_uuid, year.toString()).subscribe((res) => {
      console.log('getChartLineYear res:', res);
      this.ndYearList = res.data;
      this.isLoading = false;
    });
  }

}
