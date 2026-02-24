import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IArea } from '../../../territories/areas/models/area.model';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { AreaService } from '../../../territories/areas/area.service';
import { KpiService } from '../../services/kpi.service';
import { PERIOD_OPTIONS, PeriodKey, computeDateRange } from '../kpi-period.utils';

// Displays flat per-user KPI filtered by SubArea within an Area.
// Route: subarea/:area_uuid
// Drill-down: SubArea name to Commune view (/commune/:subarea_uuid)

@Component({
  selector: 'app-kpi-table-view-subarea',
  standalone: false,
  templateUrl: './kpi-table-view-subarea.component.html',
  styleUrl: './kpi-table-view-subarea.component.scss',
})
export class KpiTableViewSubareaComponent implements OnInit, OnDestroy {

  // DI
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private areaService = inject(AreaService);
  private kpiService  = inject(KpiService);

  // Signals
  isLoading      = signal(false);
  area           = signal<IArea | undefined>(undefined);
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
      const area_uuid: string = params['area_uuid'];
      this.isLoading.set(true);
      this.areaService.getBy(area_uuid).subscribe({
        next:  (res) => { this.area.set(res.data); this.loadData(); },
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
    const a = this.area();
    if (!a || !this.start_date || !this.end_date) return;
    this.isLoading.set(true);
    this.kpiService.TableViewSubArea(
      a.country_uuid, a.province_uuid, a.uuid, this.start_date, this.end_date,
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

  navigateToCommune(subarea_uuid: string): void {
    this.router.navigate(['/web/dashboard/key-performance-indicators/commune', subarea_uuid]);
  }

  exportToCSV(): void {
    const list = this.filteredList();
    if (!list.length) return;
    const headers = ['Sous-Zone', 'Agent', 'Role', 'Visites', 'Cible', '% Objectif'];
    const rows = list.map(i =>
      [i.name, i.signature, i.title, i.total_visits, i.target, i.objectif].join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }),
    );
    link.download = `kpi-subarea-${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }
}
