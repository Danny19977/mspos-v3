import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { IUser } from '../../management/user/models/user.model';

export type IndividualTab = 'nd' | 'sos' | 'sei';

@Component({
  selector: 'app-individual',
  standalone: false,
  templateUrl: './individual.component.html',
  styleUrl: './individual.component.scss',
})
export class IndividualComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  activeTab = signal<IndividualTab>('nd');
  currentUser = signal<IUser | null>(null);
  isLoading = signal(false);

  selectedPeriod = signal<string>('1W');
  start_date = signal('');
  end_date = signal('');
  customStartDate = signal('');
  customEndDate = signal('');

  ngOnInit(): void {
    this.authService
      .user()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.applyPeriod(this.selectedPeriod());
        },
      });
  }

  applyPeriod(period: string): void {
    this.selectedPeriod.set(period);
    if (period === 'CUSTOM') return;

    const now = new Date();
    const start = new Date();
    switch (period) {
      case 'TODAY': break;
      case '1W': start.setDate(now.getDate() - 7); break;
      case '1M': start.setMonth(now.getMonth() - 1); break;
      case '3M': start.setMonth(now.getMonth() - 3); break;
      case '6M': start.setMonth(now.getMonth() - 6); break;
      case '1Y': start.setFullYear(now.getFullYear() - 1); break;
    }

    this.start_date.set(formatDate(start, 'yyyy-MM-dd', 'en-US'));
    this.end_date.set(formatDate(now, 'yyyy-MM-dd', 'en-US'));
  }

  applyCustomPeriod(): void {
    const s = this.customStartDate();
    const e = this.customEndDate();
    if (!s || !e || s > e) return;
    this.start_date.set(s);
    this.end_date.set(e);
  }
}
