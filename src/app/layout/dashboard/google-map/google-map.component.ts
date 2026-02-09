import { Component, OnInit, Renderer2 } from '@angular/core';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CommonService } from '../../../shared/common/common.service';
import { formatDate } from '@angular/common';
import { GoogleMapService } from '../services/google-map.service';
import { GoogleMapModel } from '../models/dashboard.models';
import { GoogleMapsLoaderService } from '../../../services/google-maps-loader.service';

@Component({
  selector: 'app-google-map',
  standalone: false,
  templateUrl: './google-map.component.html',
  styleUrl: './google-map.component.scss'
})
export class GoogleMapComponent implements OnInit {
  public routes = routes;
  base = '';
  page = '';
  last = '';

  isLoading = false;
  hasMapError = false;
  mapErrorMessage = '';


  dateRange: FormGroup;
  start_date!: string;
  end_date!: string;
  searchQuery: string = '';

  // Filtre 
  rangeDate: any[] = [];

  googleMapList: GoogleMapModel[] = [];

  constructor(
    private common: CommonService,
    private _formBuilder: FormBuilder,
    private renderer: Renderer2,
    private googleMapService: GoogleMapService,
    private googleMapsLoader: GoogleMapsLoaderService
  ) {
    // Initialize FormGroup in constructor
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      rangeValue: [this.rangeDate],
      search: ['']
    });

    this.common.base.subscribe((base: string) => {
      this.base = base;
    });
    this.common.page.subscribe((page: string) => {
      this.page = page;
    });
    this.common.last.subscribe((last: string) => {
      this.last = last;
    });
    if (this.last == 'google-maps') {
      this.renderer.addClass(document.body, 'date-picker-dashboard');
    }
  }

  ngOnInit() {
    this.isLoading = true;
    this.hasMapError = false;

    // Load Google Maps first
    this.googleMapsLoader.loadGoogleMaps().then(() => {
      this.initializeComponent();
    }).catch((error) => {
      console.error('Failed to load Google Maps:', error);
      this.hasMapError = true;
      this.mapErrorMessage = 'Failed to load Google Maps. Please check your API key and internet connection.';
      this.isLoading = false;
    });
  }

  private initializeComponent() {
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');

    this.getPosFormList(this.start_date, this.end_date);

    this.onChanges();
  }



  onChanges(): void {
    this.dateRange.valueChanges.subscribe(val => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');
      this.searchQuery = val.search || '';

      this.getPosFormList(this.start_date, this.end_date, this.searchQuery);
    });
  }


  getPosFormList(start_date: string, end_date: string, search?: string) {
    this.googleMapService.getGoogleMap(start_date, end_date, search).subscribe({
      next: (res) => {
        const dataList = res?.data || [];
        const dataListFilter = dataList.filter((item: any) => item.latitude !== 0 && item.longitude !== 0);
        this.googleMapList = dataListFilter;
        console.log("googleMapList", this.googleMapList);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching Google Map data:', err);
        this.googleMapList = [];
        this.isLoading = false;
      }
    });
  }

}
