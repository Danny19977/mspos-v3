import {
  Component, inject, OnInit, signal, computed,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { AuthService } from '../../../../auth/auth.service';
import { KpiService } from '../../services/kpi.service';
import { KpiUserVisitSummaryModel } from '../../models/dashboard.models';
import { KpiTableViewParams } from '../../services/kpi.service';

@Component({
  selector: 'app-kpi-user-visit-summary',
  standalone: false,
  templateUrl: './kpi-user-visit-summary.component.html',
  styleUrl:    './kpi-user-visit-summary.component.scss',
})
export class KpiUserVisitSummaryComponent implements OnInit {

  private auth       = inject(AuthService);
  private kpiService = inject(KpiService);
  private fb         = inject(FormBuilder);

  // ── Date range ────────────────────────────────────────────────────────────
  start_date = '';
  end_date   = '';
  dateRange!: FormGroup;

  // ── User context ──────────────────────────────────────────────────────────
  country_uuid  = '';
  province_uuid = '';
  area_uuid     = '';

  // ── UI State ──────────────────────────────────────────────────────────────
  isLoading   = signal(false);
  titleFilter = signal('');
  sortKey     = signal<'daily_pct' | 'monthly_pct' | 'yearly_pct' | 'range_pct' | 'name'>('monthly_pct');
  sortDesc    = signal(true);
  viewMode    = signal<'table' | 'cards'>('table');

  readonly TITLES = ['', 'ASM', 'Supervisor', 'DR', 'Cyclo'];

  // ── Data ──────────────────────────────────────────────────────────────────
  private raw = signal<KpiUserVisitSummaryModel[]>([]);

  // ── Computed: filter + sort ──────────────────────────────────────────────
  rows = computed<KpiUserVisitSummaryModel[]>(() => {
    let list = this.raw();
    if (this.titleFilter()) list = list.filter(r => r.title === this.titleFilter());
    const key  = this.sortKey();
    const desc = this.sortDesc();
    list = [...list].sort((a, b) => {
      const av = (a as any)[key] ?? 0;
      const bv = (b as any)[key] ?? 0;
      return desc ? bv - av : av - bv;
    });
    return list;
  });

  // ── Stats ───────────────────────────────────────────────────────────────
  stats = computed(() => {
    const list = this.rows();
    if (!list.length) return null;
    const sum = (k: keyof KpiUserVisitSummaryModel) =>
      list.reduce((s, r) => s + ((r[k] as number) ?? 0), 0);
    const above = (k: keyof KpiUserVisitSummaryModel, pct: number) =>
      list.filter(r => ((r[k] as number) ?? 0) >= pct).length;
    return {
      total:      list.length,
      onTarget:   above('monthly_pct', 100),
      atRisk:     list.filter(r => r.monthly_pct >= 70 && r.monthly_pct < 100).length,
      critical:   list.filter(r => r.monthly_pct < 70).length,
      avgMonthly: Math.round(sum('monthly_pct') / list.length),
      totalVisitsRange: sum('total_visits'),
    };
  });

  ngOnInit(): void {
    const now      = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.start_date = formatDate(firstDay, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(lastDay,  'yyyy-MM-dd', 'en-US');
    this.dateRange  = this.fb.group({ rangeValue: new FormControl([firstDay, lastDay]) });

    this.auth.user().subscribe(user => {
      this.country_uuid  = user.country_uuid  ?? '';
      this.province_uuid = user.province_uuid ?? '';
      this.area_uuid     = user.area_uuid     ?? '';
      this.load();
    });

    this.dateRange.valueChanges.subscribe(val => {
      if (val.rangeValue?.[0] && val.rangeValue?.[1]) {
        this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');
        const end = new Date(val.rangeValue[1]);
        end.setDate(end.getDate() + 1);
        this.end_date = formatDate(end, 'yyyy-MM-dd', 'en-US');
        this.load();
      }
    });
  }

  load(): void {
    if (!this.country_uuid) return;
    this.isLoading.set(true);
    const params: KpiTableViewParams = {
      country_uuid:  this.country_uuid,
      province_uuid: this.province_uuid || undefined,
      area_uuid:     this.area_uuid     || undefined,
      start_date:    this.start_date,
      end_date:      this.end_date,
      title:         this.titleFilter() || undefined,
    };
    this.kpiService.UserVisitSummary(params).subscribe({
      next: res => {
        this.raw.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  setTitle(t: string): void {
    this.titleFilter.set(t);
    this.load();
  }

  setSort(k: typeof this.sortKey extends () => infer T ? T : never): void {
    if (this.sortKey() === k) { this.sortDesc.update(v => !v); } else { this.sortKey.set(k as any); this.sortDesc.set(true); }
  }

  sortIcon(k: string): string {
    if (this.sortKey() !== k) return 'ti ti-selector';
    return this.sortDesc() ? 'ti ti-sort-descending' : 'ti ti-sort-ascending';
  }

  barColor(pct: number): string {
    if (pct >= 100) return '#06d6a0';
    if (pct >=  70) return '#ffd166';
    return '#ef476f';
  }

  statusClass(pct: number): string {
    if (pct >= 100) return 'kpi-vs-success';
    if (pct >=  70) return 'kpi-vs-warning';
    return 'kpi-vs-danger';
  }

  trackBy(_: number, r: KpiUserVisitSummaryModel): string { return r.user_uuid; }
}
