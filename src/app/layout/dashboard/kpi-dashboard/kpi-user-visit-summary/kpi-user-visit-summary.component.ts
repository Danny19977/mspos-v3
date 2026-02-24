import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ICountry } from '../../../territories/country/models/country.model';
import { KpiUserVisitSummaryModel } from '../../models/dashboard.models';
import { AuthService } from '../../../../auth/auth.service';
import { CountryService } from '../../../territories/country/country.service';
import { KpiService } from '../../services/kpi.service';
import { PERIOD_OPTIONS, PeriodKey, computeDateRange } from '../kpi-period.utils';

@Component({
  selector: 'app-kpi-user-visit-summary',
  standalone: false,
  templateUrl: './kpi-user-visit-summary.component.html',
  styleUrl: './kpi-user-visit-summary.component.scss',
})
export class KpiUserVisitSummaryComponent implements OnInit, OnDestroy {

  //  DI 
  private authService    = inject(AuthService);
  private countryService = inject(CountryService);
  private kpiService     = inject(KpiService);

  //  Signals 
  isLoading       = signal(false);
  countryList     = signal<ICountry[]>([]);
  selectedCountry = signal<ICountry | undefined>(undefined);
  summaryList     = signal<KpiUserVisitSummaryModel[]>([]);
  searchTerm      = signal('');
  selectedTitle   = signal('');
  selectedPeriod  = signal<PeriodKey>('month');
  customStart     = signal('');
  customEnd       = signal('');

  //  Computed 
  filteredList = computed(() => {
    let data = this.summaryList();
    const title = this.selectedTitle();
    const term  = this.searchTerm().toLowerCase().trim();
    if (title) data = data.filter(i => i.title === title);
    if (term)  data = data.filter(i =>
      i.name.toLowerCase().includes(term) || i.title.toLowerCase().includes(term));
    return data;
  });

  totalAgents       = computed(() => this.filteredList().length);
  totalDailyVisits  = computed(() => this.filteredList().reduce((s, i) => s + i.daily_visits,   0));
  totalMonthlyVisits= computed(() => this.filteredList().reduce((s, i) => s + i.monthly_visits, 0));
  totalYearlyVisits = computed(() => this.filteredList().reduce((s, i) => s + i.yearly_visits,  0));
  totalRangeVisits  = computed(() => this.filteredList().reduce((s, i) => s + i.total_visits,   0));
  avgRangePct       = computed(() => {
    const list = this.filteredList();
    if (!list.length) return 0;
    return Math.round(list.reduce((s, i) => s + i.range_pct, 0) / list.length * 100) / 100;
  });

  //  Config 
  readonly periodOptions = PERIOD_OPTIONS;
  readonly titleOptions  = ['ASM', 'Supervisor', 'DR', 'Cyclo'];

  private start_date    = '';
  private end_date      = '';
  private country_uuid  = '';
  private autoRefreshId?: ReturnType<typeof setInterval>;

  //  Lifecycle 
  ngOnInit(): void {
    this.applyPeriod('month');

    this.authService.user().subscribe({
      next: (user) => {
        this.countryService.getAll().subscribe({
          next: (res) => {
            const list: ICountry[] = res.data ?? [];
            this.countryList.set(list);
            const country = (user.role === 'Managers' || user.role === 'Support')
              ? (list.find(c => c.uuid === user.country_uuid) ?? list[0])
              : list[0];
            if (country) {
              this.selectedCountry.set(country);
              this.country_uuid = country.uuid;
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

  //  Period 
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

  //  Country selector 
  onCountryChange(event: any): void {
    const country: ICountry = event.value;
    this.selectedCountry.set(country);
    this.country_uuid = country.uuid;
    this.loadData();
  }

  //  Data 
  loadData(): void {
    if (!this.country_uuid || !this.start_date || !this.end_date) return;
    this.isLoading.set(true);
    this.kpiService.UserVisitSummary(
      this.country_uuid, this.start_date, this.end_date,
      { title: this.selectedTitle() },
    ).subscribe({
      next:  (res) => { this.summaryList.set(res?.data ?? []); this.isLoading.set(false); },
      error: (err) => { console.error(err); this.summaryList.set([]); this.isLoading.set(false); },
    });
  }

  //  Badge helpers 
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

  //  Export 
  exportToCSV(): void {
    const list = this.filteredList();
    if (!list.length) return;
    const headers = [
      'Nom', 'Titre',
      'Visites Jour', 'Cible Jour', '% Jour',
      'Visites Mois', 'Cible Mois', '% Mois',
      'Visites Annee', 'Cible Annee', '% Annee',
      'Visites Periode', 'Cible Periode', '% Periode',
    ];
    const rows = list.map(i => [
      i.name, i.title,
      i.daily_visits,   i.daily_target,   i.daily_pct,
      i.monthly_visits, i.monthly_target, i.monthly_pct,
      i.yearly_visits,  i.yearly_target,  i.yearly_pct,
      i.total_visits,   i.range_target,   i.range_pct,
    ].join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }),
    );
    link.download = `kpi-user-summary-${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }
}
