import { formatDate } from '@angular/common';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type PeriodKey = 'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';

export interface PeriodOption {
  key: PeriodKey;
  label: string;
  icon: string;
}

// ─── Options (shown in all KPI period dropdowns) ────────────────────────────────
export const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'today',   label: "Aujourd'hui", icon: 'ti-sun'         },
  { key: 'week',    label: '1 Semaine',   icon: 'ti-calendar-week' },
  { key: 'month',   label: '1 Mois',      icon: 'ti-calendar'      },
  { key: '3months', label: '3 Mois',      icon: 'ti-calendar-stats' },
  { key: '6months', label: '6 Mois',      icon: 'ti-calendar-event' },
  { key: 'year',    label: '1 An',         icon: 'ti-calendar-time'  },
  { key: 'custom',  label: 'Personnalisé', icon: 'ti-adjustments-alt' },
];

// ─── Compute start/end date strings for a given period key ─────────────────────
export function computeDateRange(key: PeriodKey): [string, string] {
  const fmt = (d: Date) => formatDate(d, 'yyyy-MM-dd', 'en-US');
  const today = new Date();

  switch (key) {
    case 'today': {
      return [fmt(today), fmt(today)];
    }
    case 'week': {
      const from = new Date(today);
      from.setDate(today.getDate() - 7);
      return [fmt(from), fmt(today)];
    }
    case 'month': {
      return [
        fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      ];
    }
    case '3months': {
      const from = new Date(today);
      from.setMonth(today.getMonth() - 3);
      return [fmt(from), fmt(today)];
    }
    case '6months': {
      const from = new Date(today);
      from.setMonth(today.getMonth() - 6);
      return [fmt(from), fmt(today)];
    }
    case 'year': {
      return [
        fmt(new Date(today.getFullYear(), 0, 1)),
        fmt(today),
      ];
    }
    default:
      return [
        fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      ];
  }
}
