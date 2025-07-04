import { Component, computed, OnInit, signal } from '@angular/core';
import { IUser } from '../../../management/user/models/user.model';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../territories/province/models/province.model';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { ProvinceService } from '../../../territories/province/province.service';
import { AuthService } from '../../../../auth/auth.service';
import { KpiService } from '../../services/kpi.service';
import { formatDate } from '@angular/common';
import { ICountry } from '../../../territories/country/models/country.model';
import { CountryService } from '../../../territories/country/country.service';


@Component({
  selector: 'app-kpi-table-view-country',
  standalone: false,
  templateUrl: './kpi-table-view-country.component.html',
  styleUrl: './kpi-table-view-country.component.scss'
})
export class KpiTableViewCountryComponent implements OnInit {
  isLoading = false;
  currentUser!: IUser;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];



  countryList: ICountry[] = [];
  country!: ICountry;

  tableViewList: KPITableViewPriceModel[] = [];

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
          this.countryList = res.data;
          console.log('countryList:', this.countryList);
          if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
            this.getTableView(this.countryList[0].uuid, this.start_date, this.end_date);

          } else {
            this.getTableView(this.currentUser.country_uuid, this.start_date, this.end_date);

          }
        });

      },
      error: (error) => {
        console.log(error);
      }
    });

    this.onChanges();
  }

  onCheckboxCountryChange(event: any, item: ICountry) {
    if (event.target.checked) {
      console.log('item:', item);
      this.getTableView(item.uuid, this.start_date, this.end_date);
    }
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
        this.getTableView(this.countryList[0].uuid, this.start_date, this.end_date);
      } else {
        this.getTableView(this.currentUser.country_uuid,this.start_date, this.end_date);
      }
    });
  }


  onProvinceChange(event: any) {
    this.isLoading = true;
    this.country = event.value;
    console.log('country:', this.country);
    this.getTableView(this.country.uuid, this.start_date, this.end_date);
  }


  getTableView(country_uuid: string, start_date: string, end_date: string) {
    this.kpiService.TableViewCountry(country_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      console.log("tableViewList", this.tableViewList);
      this.isLoading = false;
    });
  }
}

