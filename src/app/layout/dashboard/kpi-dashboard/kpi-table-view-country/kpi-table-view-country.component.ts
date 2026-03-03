import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { AuthService } from '../../../../auth/auth.service';
import { KpiService } from '../../services/kpi.service';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { KpiTableViewParams } from '../../services/kpi.service';

@Component({
  selector: 'app-kpi-table-view-country',
  standalone: false,
  templateUrl: './kpi-table-view-country.component.html',
  styleUrl: './kpi-table-view-country.component.scss',
})
export class KpiTableViewCountryComponent implements OnInit {

  private route       = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private kpiService  = inject(KpiService);
  private fb          = inject(FormBuilder);

  country_uuid = '';
  start_date   = '';
  end_date     = '';
  dateRange!: FormGroup;

  isLoading = signal(false);
  data      = signal<KPITableViewPriceModel[]>([]);
  titleFilter = signal('');

  readonly TITLES = ['', 'ASM', 'Supervisor', 'DR', 'Cyclo'];

  grouped = signal<{ name: string; uuid: string; rows: KPITableViewPriceModel[] }[]>([]);

  ngOnInit(): void {
    const now      = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.start_date = formatDate(firstDay, 'yyyy-MM-dd', 'en-US');
    this.end_date   = formatDate(lastDay,  'yyyy-MM-dd', 'en-US');
    this.dateRange  = this.fb.group({ rangeValue: new FormControl([firstDay, lastDay]) });

    this.country_uuid = this.route.snapshot.params['country'] ?? '';

    this.authService.user().subscribe(user => {
      if (!this.country_uuid) this.country_uuid = user.country_uuid ?? '';
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
      country_uuid: this.country_uuid,
      start_date:   this.start_date,
      end_date:     this.end_date,
      title:        this.titleFilter() || undefined,
    };
    this.kpiService.TableViewCountry(params).subscribe({
      next: res => {
        const rows: KPITableViewPriceModel[] = res.data ?? [];
        this.data.set(rows);
        this.buildGrouped(rows);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // Backend already filters by title — group what's returned
  buildGrouped(rows: KPITableViewPriceModel[]): void {
    const map = new Map<string, KPITableViewPriceModel[]>();
    for (const r of rows) {
      const key = r.uuid ?? 'all';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    this.grouped.set([...map.entries()].map(([uuid, rs]) => ({ uuid, name: rs[0].name, rows: rs })));
  }

  onTitleChange(t: string): void {
    this.titleFilter.set(t);
    this.load(); // server-side title filter
  }

  getPctClass(p: number): string {
    if (p >= 100) return 'text-success fw-bold';
    if (p >= 80)  return 'text-primary';
    if (p >= 50)  return 'text-warning';
    return 'text-danger';
  }

  getBarColor(p: number): string {
    if (p >= 100) return 'bg-success';
    if (p >= 80)  return 'bg-primary';
    if (p >= 50)  return 'bg-warning';
    return 'bg-danger';
  }

  barWidth(p: number): string { return `${Math.min(p, 100)}%`; }
}
