import { AfterViewChecked, Component, OnInit, inject, signal, computed, DestroyRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { BsDaterangepickerDirective } from 'ngx-bootstrap/datepicker';

import { AuthService } from '../../../auth/auth.service';
import { ObservationService } from '../services/observation.service';
import { IObservationResponse, IObservationPagination } from '../models/observation.model';
import { IUser } from '../../management/user/models/user.model';
import { ProvinceService } from '../../territories/province/province.service';
import { AreaService } from '../../territories/areas/area.service';
import { SubareaService } from '../../territories/subarea/subarea.service';
import { IProvince } from '../../territories/province/models/province.model';
import { IArea } from '../../territories/areas/models/area.model';
import { ISubArea } from '../../territories/subarea/models/subarea.model';

/** Couleur de badge selon le rôle de l'agent */
const ROLE_BADGE: Record<string, { bg: string; icon: string }> = {
  support:    { bg: 'badge-soft-dark',    icon: 'ti-shield' },
  managers:   { bg: 'badge-soft-primary', icon: 'ti-briefcase' },
  asm:        { bg: 'badge-soft-info',    icon: 'ti-layers' },
  supervisor: { bg: 'badge-soft-warning', icon: 'ti-users' },
  sup:        { bg: 'badge-soft-warning', icon: 'ti-users' },
  dr:         { bg: 'badge-soft-success', icon: 'ti-user-check' },
  cyclo:      { bg: 'badge-soft-danger',  icon: 'ti-user' },
};

const DEFAULT_BADGE = { bg: 'badge-soft-secondary', icon: 'ti-user' };

export type ViewMode = 'cards' | 'table';

export interface PeriodOption {
  key: string;
  label: string;
}

@Component({
  selector: 'app-data-observations',
  standalone: false,
  templateUrl: './data-observations.component.html',
  styleUrl: './data-observations.component.scss',
})
export class DataObservationsComponent implements OnInit, AfterViewChecked {

  // ─── Injected services ────────────────────────────────────────────────────
  private readonly fb                  = inject(FormBuilder);
  private readonly authService         = inject(AuthService);
  private readonly observationService  = inject(ObservationService);
  private readonly toastr              = inject(ToastrService);
  private readonly destroyRef          = inject(DestroyRef);
  private readonly provinceService     = inject(ProvinceService);
  private readonly areaService         = inject(AreaService);
  private readonly subAreaService      = inject(SubareaService);

  // ─── Signals ──────────────────────────────────────────────────────────────
  readonly isLoading     = signal(false);
  readonly currentUser   = signal<IUser | null>(null);
  readonly observations  = signal<IObservationResponse[]>([]);
  readonly pagination    = signal<IObservationPagination | null>(null);
  readonly viewMode      = signal<ViewMode>('cards');
  readonly selectedPeriod = signal('1month');

  // Geography lists
  readonly provinceList  = signal<IProvince[]>([]);
  readonly areaList      = signal<IArea[]>([]);
  readonly subAreaList   = signal<ISubArea[]>([]);

  // Derived
  readonly hasData = computed(() => this.observations().length > 0);
  readonly pages   = computed(() => {
    const p = this.pagination();
    if (!p) return [];
    return Array.from({ length: p.total_pages }, (_, i) => i + 1);
  });

  // ─── Filters form ─────────────────────────────────────────────────────────
  filterForm!: FormGroup;
  dateRange!: FormGroup;
  rangeDate: Date[] = [];
  private _openPickerOnNextCheck = false;
  @ViewChild('dateRangeInput') dateRangePicker?: BsDaterangepickerDirective;

  // ─── Quick period selector ────────────────────────────────────────────────
  readonly periods: PeriodOption[] = [
    { key: 'today',   label: "Aujourd'hui" },
    { key: 'week',    label: '1 semaine'   },
    { key: '1month',  label: '1 mois'      },
    { key: '3months', label: '3 mois'      },
    { key: '6months', label: '6 mois'      },
    { key: 'year',    label: '1 an'        },
    { key: 'custom',  label: 'Personnalisé' },
  ];

  constructor() {
    // Form must be built in constructor so takeUntilDestroyed has an injection context
    this.initForm();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngAfterViewChecked(): void {
    if (this._openPickerOnNextCheck && this.dateRangePicker) {
      this._openPickerOnNextCheck = false;
      this.dateRangePicker.show();
    }
  }

  ngOnInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.provinceService.getAll().subscribe((res: any) => {
          this.provinceList.set(res.data ?? []);
        });
        this.loadObservations();
      },
      error: () => this.toastr.error("Impossible de charger l'utilisateur.", 'Erreur'),
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  private initForm(): void {
    this.applyPeriod('1month');

    this.filterForm = this.fb.group({
      search:       new FormControl(''),
      limit:        new FormControl(15),
      province_uuid: new FormControl(''),
      area_uuid:     new FormControl(''),
      sub_area_uuid: new FormControl(''),
    });

    this.dateRange = this.fb.group({ rangeValue: new FormControl<Date[] | null>(null) });
    this.dateRange.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(val => {
      if (this.selectedPeriod() !== 'custom') return;
      const range = val?.rangeValue;
      if (Array.isArray(range) && range[0] && range[1]) {
        this.rangeDate = [range[0], range[1]];
        this.loadObservations(1);
      }
    });

    // Reactive search — auto-unsubscribed when component is destroyed
    this.filterForm.get('search')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadObservations(1));

    // Limit change
    this.filterForm.get('limit')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadObservations(1));

    // Province cascade
    this.filterForm.get('province_uuid')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((uuid: string) => {
      this.filterForm.patchValue({ area_uuid: '', sub_area_uuid: '' }, { emitEvent: false });
      this.areaList.set([]);
      this.subAreaList.set([]);
      if (uuid) {
        this.areaService.getAll().subscribe((res: any) => {
          this.areaList.set((res.data as IArea[]).filter(a => a.province_uuid === uuid));
        });
      }
      this.loadObservations(1);
    });

    // Area cascade
    this.filterForm.get('area_uuid')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((uuid: string) => {
      this.filterForm.patchValue({ sub_area_uuid: '' }, { emitEvent: false });
      this.subAreaList.set([]);
      if (uuid) {
        this.subAreaService.getAll().subscribe((res: any) => {
          this.subAreaList.set((res.data as ISubArea[]).filter(s => s.area_uuid === uuid));
        });
      }
      this.loadObservations(1);
    });

    // Subarea change
    this.filterForm.get('sub_area_uuid')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadObservations(1));
  }

  // ─── Data loading ─────────────────────────────────────────────────────────

  loadObservations(page = 1): void {
    this.isLoading.set(true);

    const { search, limit, province_uuid, area_uuid, sub_area_uuid } = this.filterForm.value;
    const filters = {
      page,
      limit:      limit ?? 15,
      start_date: this.formatDate(this.rangeDate[0]),
      end_date:   this.formatDate(this.rangeDate[1] ?? this.rangeDate[0]),
      search:     search ?? undefined,
    };

    let request$;
    if (sub_area_uuid) {
      request$ = this.observationService.getBySubArea(sub_area_uuid, filters);
    } else if (area_uuid) {
      request$ = this.observationService.getByArea(area_uuid, filters);
    } else if (province_uuid) {
      request$ = this.observationService.getByProvince(province_uuid, filters);
    } else {
      request$ = this.observationService.getByRole(filters);
    }

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.observations.set(res.data ?? []);
        this.pagination.set(res.pagination);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Erreur lors du chargement des observations.', 'Erreur');
        this.isLoading.set(false);
      },
    });
  }

  getPeriodLabel(): string {
    return this.periods.find(p => p.key === this.selectedPeriod())?.label ?? 'Période';
  }

  setPeriod(key: string): void {
    this.selectedPeriod.set(key);
    if (key === 'custom') {
      this._openPickerOnNextCheck = true;
      return;
    }
    this.applyPeriod(key);
    this.loadObservations(1);
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

  onPageChange(page: number): void {
    this.loadObservations(page);
  }

  refresh(): void {
    this.loadObservations(this.pagination()?.current_page ?? 1);
  }

  resetFilters(): void {
    this.areaList.set([]);
    this.subAreaList.set([]);
    this.filterForm.reset({ limit: 15, search: '', province_uuid: '', area_uuid: '', sub_area_uuid: '' }, { emitEvent: false });
    this.setPeriod('1month');
  }

  // ─── View helpers ─────────────────────────────────────────────────────────

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  roleBadge(role: string): { bg: string; icon: string } {
    return ROLE_BADGE[role?.toLowerCase()] ?? DEFAULT_BADGE;
  }

  trackByUuid(_: number, obs: IObservationResponse): string {
    return obs.uuid;
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private formatDate(d: Date): string {
    if (!d) return '';
    const iso = new Date(d);
    iso.setHours(0, 0, 0, 0);
    return iso.toISOString();
  }

  formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60)     return "À l'instant";
    if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
