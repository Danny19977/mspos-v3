import { Component, Input, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { UserFriendlyFormsService, FormHelp } from '../../services/user-friendly-forms.service';
import { HelpTooltipComponent } from '../help-tooltip/help-tooltip.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-smart-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    HelpTooltipComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SmartFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="mb-3">
      <label class="col-form-label d-flex align-items-center" [for]="fieldId">
        {{ fieldHelp?.label || label }}
        @if (required) {
          <span class="text-danger ms-1">*</span>
        }
        @if (fieldHelp?.helpText) {
          <app-help-tooltip [helpText]="fieldHelp?.helpText || ''"></app-help-tooltip>
        }
      </label>

      @switch (type) {
        @case ('text') {
          <input 
            [id]="fieldId"
            type="text" 
            class="form-control" 
            [class.is-invalid]="control.invalid && control.touched"
            [class.is-valid]="control.valid && control.touched && control.value"
            [placeholder]="fieldHelp?.placeholder || placeholder"
            [formControl]="control"
            [readonly]="readonly"
            [disabled]="disabled">
        }
        @case ('textarea') {
          <textarea 
            [id]="fieldId"
            class="form-control" 
            [class.is-invalid]="control.invalid && control.touched"
            [class.is-valid]="control.valid && control.touched && control.value"
            [placeholder]="fieldHelp?.placeholder || placeholder"
            [formControl]="control"
            [rows]="rows || 3"
            [readonly]="readonly"
            [disabled]="disabled">
          </textarea>
        }
        @case ('number') {
          <input 
            [id]="fieldId"
            type="number" 
            class="form-control" 
            [class.is-invalid]="control.invalid && control.touched"
            [class.is-valid]="control.valid && control.touched && control.value"
            [placeholder]="fieldHelp?.placeholder || placeholder"
            [formControl]="control"
            [min]="min || null"
            [max]="max || null"
            [readonly]="readonly"
            [disabled]="disabled">
        }
        @case ('email') {
          <input 
            [id]="fieldId"
            type="email" 
            class="form-control" 
            [class.is-invalid]="control.invalid && control.touched"
            [class.is-valid]="control.valid && control.touched && control.value"
            [placeholder]="fieldHelp?.placeholder || placeholder"
            [formControl]="control"
            [readonly]="readonly"
            [disabled]="disabled">
        }
        @case ('tel') {
          <input 
            [id]="fieldId"
            type="tel" 
            class="form-control" 
            [class.is-invalid]="control.invalid && control.touched"
            [class.is-valid]="control.valid && control.touched && control.value"
            [placeholder]="fieldHelp?.placeholder || placeholder"
            [formControl]="control"
            [readonly]="readonly"
            [disabled]="disabled">
        }
        @case ('select') {
          <select 
            [id]="fieldId"
            class="form-control" 
            [class.is-invalid]="control.invalid && control.touched"
            [class.is-valid]="control.valid && control.touched && control.value"
            [formControl]="control"
            [disabled]="disabled">
            <option value="" disabled [selected]="!control.value">
              {{ fieldHelp?.placeholder || placeholder || 'Sélectionnez une option...' }}
            </option>
            @for (option of options; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        }
      }

      @if (fieldHelp?.example) {
        <small class="text-muted">
          💡 {{ fieldHelp?.example }}
        </small>
      }

      @if (control.invalid && control.touched) {
        <div class="invalid-feedback d-block">
          <i class="ti ti-alert-circle me-1"></i>
          {{ getErrorMessage() }}
        </div>
      }

      @if (control.valid && control.touched && control.value && showSuccess) {
        <div class="valid-feedback d-block">
          <i class="ti ti-check-circle me-1"></i>
          Parfait !
        </div>
      }
    </div>
  `,
  styles: [`
    .is-valid {
      border-color: #28a745;
    }
    .is-invalid {
      border-color: #dc3545;
    }
    .valid-feedback {
      color: #28a745;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .invalid-feedback {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .form-control:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
  `]
})
export class SmartFieldComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() fieldName: string = '';
  @Input() formType: 'posform' | 'pos' | 'user' = 'posform';
  @Input() type: 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'select' = 'text';
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showSuccess: boolean = true;
  @Input() options: Array<{value: any, label: string}> = [];
  @Input() rows?: number;
  @Input() min?: number;
  @Input() max?: number;

  control = new FormControl();
  fieldHelp: FormHelp | null = null;
  fieldId: string = '';
  
  private subscription = new Subscription();
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private userFriendlyService: UserFriendlyFormsService) {}

  ngOnInit() {
    this.fieldId = `field_${this.fieldName}_${Math.random().toString(36).substr(2, 9)}`;
    this.fieldHelp = this.userFriendlyService.getFieldHelp(this.formType, this.fieldName);
    
    this.subscription.add(
      this.control.valueChanges.subscribe(value => {
        this.onChange(value);
      })
    );
    
    this.subscription.add(
      this.control.statusChanges.subscribe(() => {
        if (this.control.touched) {
          this.onTouched();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  getErrorMessage(): string {
    if (this.control.errors) {
      const firstError = Object.keys(this.control.errors)[0];
      return this.userFriendlyService.getValidationMessage(this.formType, this.fieldName, firstError);
    }
    return '';
  }
}
