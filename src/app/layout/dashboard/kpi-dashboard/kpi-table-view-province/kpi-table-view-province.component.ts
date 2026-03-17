import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { AuthService } from '../../../../auth/auth.service';
import { KpiService } from '../../services/kpi.service';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { KpiTableViewParams } from '../../services/kpi.service';

@Component({
  selector: 'app-kpi-table-view-province',
  standalone: false,
  templateUrl: './kpi-table-view-province.component.html',
  styleUrl: './kpi-table-view-province.component.scss',
})
export class KpiTableViewProvinceComponent implements OnInit {

  private route       = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private kpiService  = inject(KpiService);
  private fb          = inject(FormBuilder);

  country_uuid  = '';
  province_uuid = '';
  area_uuid     = '';
  sub_area_uuid = '';
  commune_uuid  = '';
  start_date    = '';
  end_date      = '';
  dateRange!: FormGroup;

  /** true while date-range picker is the active date source */
  private useDatePicker = false;

  isLoading   = signal(false);
  data        = signal<KPITableViewPriceModel[]>([]);
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

    // Subscribe to ALL query-param changes (fired every time the parent re-navigates)
    this.route.queryParams.subscribe(qp => {
      const newProvince = qp['province_uuid'] ?? '';
      const newArea     = qp['area_uuid']     ?? '';
      const newSubArea  = qp['sub_area_uuid'] ?? '';
      const newCommune  = qp['commune_uuid']  ?? '';
      const newTitle    = qp['title']         ?? '';

      this.province_uuid = newProvince;
      this.area_uuid     = newArea;
      this.sub_area_uuid = newSubArea;
      this.commune_uuid  = newCommune;

      if (newTitle !== this.titleFilter()) {
        this.titleFilter.set(newTitle);
      }

      // Only override dates from query params when the date picker has NOT been used
      if (!this.useDatePicker) {
        if (qp['start_date']) this.start_date = qp['start_date'];
        if (qp['end_date'])   this.end_date   = qp['end_date'];
      }

      // country comes from the route param ':country'
      const routeCountry = this.route.snapshot.params['country'] ?? '';
      if (routeCountry && routeCountry !== 'all') {
        this.country_uuid = routeCountry;
        this.load();
      } else {
        // Fall back to auth user's country
        this.authService.user().subscribe(user => {
          if (!this.country_uuid) this.country_uuid = user.country_uuid ?? '';
          if (!this.province_uuid) this.province_uuid = user.province_uuid ?? '';
          this.load();
        });
      }
    });

    // When user picks a custom date range in the child picker, override
    this.dateRange.valueChanges.subscribe(val => {
      if (val.rangeValue?.[0] && val.rangeValue?.[1]) {
        this.useDatePicker = true;
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
      province_uuid: this.province_uuid  || undefined,
      area_uuid:     this.area_uuid      || undefined,
      sub_area_uuid: this.sub_area_uuid  || undefined,
      commune_uuid:  this.commune_uuid   || undefined,
      start_date:    this.start_date,
      end_date:      this.end_date,
      title:         this.titleFilter() || undefined,
    };
    this.kpiService.TableViewProvince(params).subscribe({
      next: res => {
        const rows: KPITableViewPriceModel[] = res.data ?? [];
        this.data.set(rows);
        this.buildGrouped(rows);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // Backend already filters — group rows by province_uuid (present in province response)
  buildGrouped(rows: KPITableViewPriceModel[]): void {
    const map = new Map<string, KPITableViewPriceModel[]>();
    for (const r of rows) {
      const key = (r as any).province_uuid ?? r.name ?? 'all';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    this.grouped.set([...map.entries()].map(([uuid, rs]) => ({ uuid, name: rs[0].name, rows: rs })));
  }

  onTitleChange(t: string): void {
    this.titleFilter.set(t);
    this.load();
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
