import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IProvince } from '../../../territories/province/models/province.model';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { ProvinceService } from '../../../territories/province/province.service';
import { KpiService } from '../../services/kpi.service';
import { PERIOD_OPTIONS, PeriodKey, computeDateRange } from '../kpi-period.utils';

// Displays flat per-user KPI filtered by Area within a Province.
// Route: area/:province_uuid
// Drill-down: Area name to SubArea view (/subarea/:area_uuid)

@Component({
  selector: 'app-kpi-table-view-area',
  standalone: false,
  templateUrl: './kpi-table-view-area.component.html',
  styleUrl: './kpi-table-view-area.component.scss',
})
export class KpiTableViewAreaComponent implements OnInit, OnDestroy {

  // DI
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private provinceService = inject(ProvinceService);
  private kpiService      = inject(KpiService);

  // Signals
  isLoading      = signal(false);
  province       = signal<IProvince | undefined>(undefined);
  tableViewList  = signal<KPITableViewPriceModel[]>([]);
  searchTerm     = signal('');
  selectedTitle  = signal('');
  selectedPeriod = signal<PeriodKey>('month');
  customStart    = signal('');
  customEnd      = signal('');

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
  private autoRefreshId?: ReturnType<typeof setInterval>;

  // Lifecycle
  ngOnInit(): void {
    this.applyPeriod('month');

    this.route.params.subscribe(params => {
      const province_uuid: string = params['province_uuid'];
      this.isLoading.set(true);
      this.provinceService.getBy(province_uuid).subscribe({
        next:  (res) => { this.province.set(res.data); this.loadData(); },
        error: (err) => { console.error(err); this.isLoading.set(false); },
      });
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

  // Data
  loadData(): void {
    const p = this.province();
    if (!p || !this.start_date || !this.end_date) return;
    this.isLoading.set(true);
    this.kpiService.TableViewArea(p.country_uuid, p.uuid, this.start_date, this.end_date).subscribe({
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

  navigateToSubArea(area_uuid: string): void {
    this.router.navigate(['/web/dashboard/key-performance-indicators/subarea', area_uuid]);
  }

  exportToCSV(): void {
    const list = this.filteredList();
    if (!list.length) return;
    const headers = ['Zone', 'Agent', 'Role', 'Visites', 'Cible', '% Objectif'];
    const rows = list.map(i =>
      [i.name, i.signature, i.title, i.total_visits, i.target, i.objectif].join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }),
    );
    link.download = `kpi-area-${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }
}
