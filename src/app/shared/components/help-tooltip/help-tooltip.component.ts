import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-help-tooltip',
  standalone: true,
  template: `
    <button type="button" 
            class="btn btn-link btn-sm p-0 ms-2" 
            [attr.data-bs-toggle]="'tooltip'"
            [attr.data-bs-placement]="placement"
            [attr.title]="helpText"
            [attr.aria-label]="'Aide: ' + helpText">
      <i class="ti ti-help-circle text-primary"></i>
    </button>
  `,
  styles: [`
    .btn-link:hover {
      text-decoration: none;
    }
    .ti-help-circle {
      font-size: 1.1rem;
    }
  `]
})
export class HelpTooltipComponent {
  @Input() helpText: string = '';
  @Input() placement: string = 'top';
}
