import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { GoogleMapService } from '../services/google-map.service';
import { GoogleMapModel } from '../models/dashboard.models';
import { GoogleMapsLoaderService } from '../../../services/google-maps-loader.service';
import { ProvinceService } from '../../territories/province/province.service';
import { IProvince } from '../../territories/province/models/province.model';

export interface PeriodOption  { key: string; label: string; }
export interface UserTypeOption { key: string; label: string; }

@Component({
  selector: 'app-google-map',
  standalone: false,
  templateUrl: './google-map.component.html',
  styleUrl: './google-map.component.scss',
})
export class GoogleMapComponent implements OnInit {

  // ─── Injected services ────────────────────────────────────────────────────
  private readonly fb               = inject(FormBuilder);
  private readonly googleMapService = inject(GoogleMapService);
  private readonly googleMapsLoader = inject(GoogleMapsLoaderService);
  private readonly provinceService  = inject(ProvinceService);
  private readonly destroyRef       = inject(DestroyRef);

  // ─── Signals ──────────────────────────────────────────────────────────────
  readonly isLoading     = signal(false);
  readonly hasMapError   = signal(false);
  readonly mapErrorMsg   = signal('');
  readonly googleMapList = signal<GoogleMapModel[]>([]);
  readonly provinceList  = signal<IProvince[]>([]);
  readonly selectedPeriod = signal('1month');

  // ─── Filter form ──────────────────────────────────────────────────────────
  filterForm!: FormGroup;
  rangeDate: Date[] = [];

  // ─── Period options ───────────────────────────────────────────────────────
  readonly periods: PeriodOption[] = [
    { key: 'today',   label: "Aujourd'hui" },
    { key: 'week',    label: '1 semaine'   },
    { key: '1month',  label: '1 mois'      },
    { key: '3months', label: '3 mois'      },
    { key: '6months', label: '6 mois'      },
    { key: 'year',    label: '1 an'        },
  ];

  // ─── User-type options ────────────────────────────────────────────────────
  readonly userTypes: UserTypeOption[] = [
    { key: '',           label: 'Tous'        },
    { key: 'asm',        label: 'ASM'         },
    { key: 'supervisor', label: 'Superviseur' },
    { key: 'dr',         label: 'DR'          },
    { key: 'cyclo',      label: 'Cyclo'       },
  ];

  constructor() {
    // Must be in constructor so takeUntilDestroyed has an injection context
    this.initForm();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.isLoading.set(true);
    this.googleMapsLoader.loadGoogleMaps()
      .then(() => {
        this.loadProvinces();
        this.loadMap();
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        this.hasMapError.set(true);
        this.mapErrorMsg.set('Impossible de charger Google Maps. Vérifiez votre clé API et la connexion internet.');
        this.isLoading.set(false);
      });
  }

  // ─── Init form ────────────────────────────────────────────────────────────

  private initForm(): void {
    this.applyPeriod('1month');

    this.filterForm = this.fb.group({
      search:        new FormControl(''),
      province_uuid: new FormControl(''),
      user_type:     new FormControl(''),
    });

    // Reactive search with debounce
    this.filterForm.get('search')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadMap());

    // Instant filter on province / user_type
    this.filterForm.get('province_uuid')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadMap());

    this.filterForm.get('user_type')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadMap());
  }

  // ─── Data loading ─────────────────────────────────────────────────────────

  private loadProvinces(): void {
    this.provinceService.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => this.provinceList.set(res.data ?? []),
      error: (err) => console.error('Failed to load provinces:', err),
    });
  }

  loadMap(): void {
    this.isLoading.set(true);
    const { search, province_uuid, user_type } = this.filterForm.value;

    this.googleMapService.getGoogleMap(
      this.formatDate(this.rangeDate[0]),
      this.formatDate(this.rangeDate[1] ?? this.rangeDate[0]),
      search        || undefined,
      province_uuid || undefined,
      user_type     || undefined,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        const data: GoogleMapModel[] = (res?.data ?? [])
          .filter((item: GoogleMapModel) => item.latitude !== 0 && item.longitude !== 0);
        this.googleMapList.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching Google Map data:', err);
        this.googleMapList.set([]);
        this.isLoading.set(false);
      },
    });
  }

  // ─── Period ───────────────────────────────────────────────────────────────

  setPeriod(key: string): void {
    this.selectedPeriod.set(key);
    this.applyPeriod(key);
    this.loadMap();
  }

  private applyPeriod(key: string): void {
    const end   = new Date();
    const start = new Date();
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    switch (key) {
      case 'today':   break;
      case 'week':    start.setDate(start.getDate() - 7);         break;
      case '1month':  start.setMonth(start.getMonth() - 1);       break;
      case '3months': start.setMonth(start.getMonth() - 3);       break;
      case '6months': start.setMonth(start.getMonth() - 6);       break;
      case 'year':    start.setFullYear(start.getFullYear() - 1); break;
    }
    this.rangeDate = [start, end];
  }

  refresh(): void {
    this.loadMap();
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private formatDate(d: Date): string {
    if (!d) return '';
    const iso = new Date(d);
    iso.setHours(0, 0, 0, 0);
    return iso.toISOString();
  }
}
