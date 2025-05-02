import { Component, computed, OnChanges, OnInit, Renderer2, signal, SimpleChanges, ViewChild } from '@angular/core';
import { routes } from '../../../shared/routes/routes';
import { IUser } from '../../user/models/user.model';
import { ICountry } from '../../country/models/country.model';
import { CommonService } from '../../../shared/common/common.service';
import { NdService } from '../services/nd.service';
import { CountryService } from '../../country/country.service';
import { AuthService } from '../../../auth/auth.service';


@Component({
  selector: 'app-oos-dashboard',
  standalone: false,
  templateUrl: './oos-dashboard.component.html',
  styleUrl: './oos-dashboard.component.scss'
})
export class OosDashboardComponent implements OnInit {
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
    private ndService: NdService,
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
            this.getNDYear(this.countryList()[0].uuid);
          } else { 
            this.getNDYear(this.currentUser.country_uuid);
          }
        }); 

      },
      error: (error) => {
        console.log(error);
      }
    });
 
  }
 
  getNDYear(country_uuid: string) {
    const year = new Date().getFullYear();
    this.ndService.NdTotalByBrandByMonth(country_uuid, year.toString()).subscribe((res) => {
      console.log('getNDYear res:', res);
      this.ndYearList = res.data;
      this.isLoading = false;
    });
  }
 

}
