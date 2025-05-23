import { Component, computed, OnInit, signal } from '@angular/core';
import { IUser } from '../../../user/models/user.model';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../province/models/province.model';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { ICountry } from '../../../country/models/country.model';
import { CountryService } from '../../../country/country.service';
import { ProvinceService } from '../../../province/province.service';
import { AuthService } from '../../../../auth/auth.service';
import { KpiService } from '../../services/kpi.service';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-kpi-table-view-province',
  standalone: false,
  templateUrl: './kpi-table-view-province.component.html',
  styleUrl: './kpi-table-view-province.component.scss'
})
export class KpiTableViewProvinceComponent implements OnInit {
  isLoading = false;
  currentUser!: IUser;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];



  provinceList: IProvince[] = [];
  province!: IProvince;

  tableViewList: KPITableViewPriceModel[] = []; 


  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );

  constructor( 
    private _formBuilder: FormBuilder,  
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private authService: AuthService,
    private kpiService: KpiService,
  ) { 
  }


  ngOnInit(): void {
    this.isLoading = true;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      country: new FormControl(''),
      rangeValue: new FormControl(this.rangeDate),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');


    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;

        this.countryService.getAll().subscribe((res) => {
          this.countryList.set(res.data); 
          this.provinceService.getAll().subscribe((pr) => {
            this.provinceList = pr.data; 
            if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
              this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
              
            } else {
              this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
              
            }
          });
        }); 

      },
      error: (error) => {
        console.log(error);
      }
    });

    this.onChanges();
  }


  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.countrySearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  onCheckboxCountryChange(event: any, item: ICountry) {
    if (event.target.checked) {
      console.log('item:', item);
      this.getTableView(item.uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
    }
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
        this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
      } else {
        this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
      } 
    }); 
  }


  onProvinceChange(event: any) {
    this.isLoading = true;
    this.province = event.value;
    console.log('province:', this.province);
    this.getTableView(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
  }


  getTableView(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.kpiService.TableViewProvince(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      console.log("tableViewList", this.tableViewList);
      this.isLoading = false;
    });
  } 
}
 
