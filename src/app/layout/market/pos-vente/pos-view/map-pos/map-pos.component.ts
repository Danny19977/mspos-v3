import { Component, Input, OnInit } from '@angular/core';
import { PosVenteService } from '../../pos-vente.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { GoogleMapsLoaderService } from '../../../../../services/google-maps-loader.service';
import { GoogleMapModel } from '../../../../dashboard/models/dashboard.models';

@Component({
    selector: 'app-map-pos',
    standalone: false,
    templateUrl: './map-pos.component.html',
    styleUrls: ['./map-pos.component.scss']
})
export class MapPosComponent implements OnInit {
    @Input() posUUId!: string;
    isLoading = false;
    hasMapError = false;
    mapErrorMessage = '';

    dateRange!: FormGroup;
    start_date!: string;
    end_date!: string;

    // Filtre 
    rangeDate: any[] = [];

    googleMapList: GoogleMapModel[] = [];


    constructor(
        private _formBuilder: FormBuilder,
        private posService: PosVenteService,
        private googleMapsLoader: GoogleMapsLoaderService
    ) { }


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
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        this.rangeDate = [firstDay, lastDay];

        this.dateRange = this._formBuilder.group({
            rangeValue: new FormControl(this.rangeDate),
        });
        this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
        this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');

        this.getPosFormList(this.start_date, this.end_date);

        this.onChanges();
    }


    onChanges(): void {
        this.dateRange.valueChanges.subscribe(val => {
            this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');
            this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

            this.getPosFormList(this.start_date, this.end_date);
        });
    }



    getPosFormList(start_date: string, end_date: string) {
        console.log("posUUId", this.posUUId);
        this.posService.getGoogleMap(this.posUUId, start_date, end_date).subscribe((res) => {
            const dataList = res.data;
            // const dataListFilter = dataList.filter((item: any) => item.latitude !== 0 && item.longitude !== 0);
            // this.googleMapList = dataListFilter;
            if (dataList) {
                this.googleMapList = dataList;
                console.log("googleMapList", this.googleMapList);
                this.isLoading = false;
            }
            this.isLoading = false;
        });
    }
}
