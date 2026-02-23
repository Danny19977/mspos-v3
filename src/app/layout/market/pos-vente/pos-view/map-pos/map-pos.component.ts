import { Component, Input, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { PosVenteService } from '../../pos-vente.service';
import { GoogleMapsLoaderService } from '../../../../../services/google-maps-loader.service';
import { GoogleMapModel } from '../../../../dashboard/models/dashboard.models';
import { MapPosCardComponent } from './map-pos-card/map-pos-card.component';

@Component({
    selector: 'app-map-pos',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        BsDatepickerModule,
        MapPosCardComponent
    ],
    templateUrl: './map-pos.component.html',
    styleUrls: ['./map-pos.component.scss']
})
export class MapPosComponent implements OnInit {
    // Services avec inject()
    private readonly formBuilder = inject(FormBuilder);
    private readonly posService = inject(PosVenteService);
    private readonly googleMapsLoader = inject(GoogleMapsLoaderService);
    private readonly destroyRef = inject(DestroyRef);

    @Input() posUUId!: string;

    // Signals pour l'état du composant
    readonly isLoading = signal(false);
    readonly hasMapError = signal(false);
    readonly mapErrorMessage = signal('');
    readonly dateRange = signal<FormGroup>(new FormGroup({}));
    readonly start_date = signal('');
    readonly end_date = signal('');
    readonly rangeDate = signal<any[]>([]);
    readonly googleMapList = signal<GoogleMapModel[]>([]);


    ngOnInit() {
        this.isLoading.set(true);
        this.hasMapError.set(false);
        
        console.log("posUUId", this.posUUId);
        
        // Load Google Maps first
        this.googleMapsLoader.loadGoogleMaps().then(() => {
            this.initializeComponent();
        }).catch((error) => {
            console.error('Failed to load Google Maps:', error);
            this.hasMapError.set(true);
            this.mapErrorMessage.set('Failed to load Google Maps. Please check your API key and internet connection.');
            this.isLoading.set(false);
        });
    }

    private initializeComponent() {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        this.rangeDate.set([firstDay, lastDay]);

        this.dateRange.set(this.formBuilder.group({
            rangeValue: new FormControl(this.rangeDate()),
        }));
        this.start_date.set(formatDate(this.dateRange().value.rangeValue[0], 'yyyy-MM-dd', 'en-US'));
        this.end_date.set(formatDate(this.dateRange().value.rangeValue[1], 'yyyy-MM-dd', 'en-US'));

        this.getPosFormList(this.start_date(), this.end_date());

        this.onChanges();
    }


    onChanges(): void {
        this.dateRange().valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(val => {
                this.start_date.set(formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US'));
                this.end_date.set(formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US'));

                this.getPosFormList(this.start_date(), this.end_date());
            });
    }



    getPosFormList(start_date: string, end_date: string) {
        this.isLoading.set(true);
        this.posService.getGoogleMap(this.posUUId, start_date, end_date)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    const dataList: GoogleMapModel[] = res.data || [];
                    const filtered = dataList.filter(item =>
                        item.latitude && item.longitude &&
                        item.latitude !== 0 && item.longitude !== 0
                    );
                    this.googleMapList.set(filtered);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('Erreur chargement carte:', err);
                    this.hasMapError.set(true);
                    this.mapErrorMessage.set('Erreur lors du chargement des données de la carte.');
                    this.isLoading.set(false);
                }
            });
    }
}
