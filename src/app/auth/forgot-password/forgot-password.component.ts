import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { routes } from '../../shared/routes/routes';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  readonly dateY = formatDate(new Date(), 'yyyy', 'en');
  readonly routes = routes;
  readonly isLoading = signal(false);
  readonly submitted = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading.set(true);
      this.authService.forgotPassword(this.form.value.email).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.submitted.set(true);
          this.toastr.success('Un email de réinitialisation a été envoyé', 'Succès');
        },
        error: (err) => {
          this.isLoading.set(false);
          const message = err.error?.message || 'Adresse email invalide';
          this.toastr.error(message, 'Erreur');
        }
      });
    }
  }
}
