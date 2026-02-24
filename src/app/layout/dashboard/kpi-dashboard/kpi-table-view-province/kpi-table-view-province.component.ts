import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IProvince } from '../../../territories/province/models/province.model';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { ProvinceService } from '../../../territories/province/province.service';
import { AuthService } from '../../../../auth/auth.service';
import { KpiService } from '../../services/kpi.service';
import { PERIOD_OPTIONS, PeriodKey, computeDateRange } from '../kpi-period.utils';

// Displays flat per-user KPI table filtered by Province.
// Route: province/:country or empty (default view)
// Drill-down: Province name to Area view (/area/:province_uuid)

@Component({
  selector: 'app-kpi-table-view-province',
  standalone: false,
  templateUrl: './kpi-table-view-province.component.html',
  styleUrl: './kpi-table-view-province.component.scss',
})
export class KpiTableViewProvinceComponent implements OnInit, OnDestroy {

  // DI
  private route            = inject(ActivatedRoute);
  private router           = inject(Router);
  private authService      = inject(AuthService);
  private provinceService  = inject(ProvinceService);
  private kpiService       = inject(KpiService);

  // Signals
  isLoading        = signal(false);
  provinceList     = signal<IProvince[]>([]);
  selectedProvince = signal<IProvince | undefined>(undefined);
  tableViewList    = signal<KPITableViewPriceModel[]>([]);
  searchTerm       = signal('');
  selectedTitle    = signal('');
  selectedPeriod   = signal<PeriodKey>('month');
  customStart      = signal('');
  customEnd        = signal('');

  // Computed
  filteredList = computed(() => {
    let data = this.tableViewList();
    const title = this.selectedTitle();
    const term  = this.searchTerm().toLowerCase().trim();
    if (title) data = data.filter(i => i.title === title);
    if (term)  data = data.filter(i =>
      i.signature.toLowerCase().includes(term) || i.name.toLowerCase().includes(term));
    return data;
  });

  totalAgents = computed(() => this.filteredList().length);
  totalVisits = computed(() => this.filteredList().reduce((s, i) => s + i.total_visits, 0));
  avgObjectif = computed(() => {
    const list = this.filteredList();
    if (!list.length) return 0;
    return Math.round(list.reduce((s, i) => s + i.objectif, 0) / list.length * 100) / 100;
  });

  // Config
  readonly periodOptions = PERIOD_OPTIONS;
  readonly titleOptions  = ['ASM', 'Supervisor', 'DR', 'Cyclo'];

  private start_date    = '';
  private end_date      = '';
  private country_uuid  = '';
  private autoRefreshId?: ReturnType<typeof setInterval>;

  // Lifecycle
  ngOnInit(): void {
    this.applyPeriod('month');

    this.authService.user().subscribe({
      next: (user) => {
        const routeCountry = this.route.snapshot.params['country'];
        this.country_uuid  = routeCountry || user.country_uuid || '';

        this.provinceService.getAll().subscribe({
          next: (res) => {
            const list: IProvince[] = res.data ?? [];
            this.provinceList.set(list);
            const province = this.country_uuid
              ? (list.find(p => p.country_uuid === this.country_uuid) ?? list[0])
              : list[0];
            if (province) {
              if (!this.country_uuid) this.country_uuid = province.country_uuid;
              this.selectedProvince.set(province);
              this.loadData();
            } else {
              this.isLoading.set(false);
            }
          },
          error: (err) => { console.error(err); this.isLoading.set(false); },
        });
      },
      error: (err) => { console.error(err); this.isLoading.set(false); },
    });

    this.autoRefreshId = setInterval(() => this.loadData(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshId) clearInterval(this.autoRefreshId);
  }

  // Period
  applyPeriod(key: PeriodKey): void {
    this.selectedPeriod.set(key);
    if (key !== 'custom') {
      const [s, e]    = computeDateRange(key);
      this.start_date = s;
      this.end_date   = e;
    }
  }

  onPeriodChange(key: string): void {
    this.applyPeriod(key as PeriodKey);
    if (key !== 'custom') this.loadData();
  }

  onCustomDateChange(): void {
    const s = this.customStart();
    const e = this.customEnd();
    if (s && e && s <= e) {
      this.start_date = s;
      this.end_date   = e;
      this.loadData();
    }
  }

  // Province selector
  onProvinceChange(event: any): void {
    const province: IProvince = event.value;
    this.selectedProvince.set(province);
    this.country_uuid = province.country_uuid;
    this.loadData();
  }

  // Data
  loadData(): void {
    const province = this.selectedProvince();
    if (!province || !this.start_date || !this.end_date) return;
    this.isLoading.set(true);
    this.kpiService.TableViewProvince(
      this.country_uuid, province.uuid, this.start_date, this.end_date,
    ).subscribe({
      next:  (res) => { this.tableViewList.set(res?.data ?? []); this.isLoading.set(false); },
      error: ()    => { this.tableViewList.set([]); this.isLoading.set(false); },
    });
  }

  // Helpers
  getPctClass(pct: number): string {
    return pct >= 100 ? 'bg-success' : pct >= 75 ? 'bg-warning text-dark' : 'bg-danger';
  }

  getTitleBadgeClass(title: string): string {
    const map: Record<string, string> = {
      ASM: 'bg-primary', Supervisor: 'bg-success',
      DR: 'bg-warning text-dark', Cyclo: 'bg-secondary',
    };
    return map[title] ?? 'bg-info';
  }

  navigateToArea(province_uuid: string): void {
    this.router.navigate(['/web/dashboard/key-performance-indicators/area', province_uuid]);
  }

  exportToCSV(): void {
    const list = this.filteredList();
    if (!list.length) return;
    const headers = ['Province', 'Agent', 'Role', 'Visites', 'Cible', '% Objectif'];
    const rows = list.map(i =>
      [i.name, i.signature, i.title, i.total_visits, i.target, i.objectif].join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }),
    );
    link.download = `kpi-province-${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }
}
