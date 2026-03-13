import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { routes } from '../../shared/routes/routes';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const passwordConfirm = control.get('password_confirm');
  if (password && passwordConfirm && password.value !== passwordConfirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  readonly dateY = formatDate(new Date(), 'yyyy', 'en');
  readonly routes = routes;
  readonly isLoading = signal(false);
  readonly success = signal(false);
  readonly showPassword = signal<boolean[]>([false, false]);

  token = '';
  form!: FormGroup;

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    this.form = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  togglePassword(index: number): void {
    const current = this.showPassword();
    current[index] = !current[index];
    this.showPassword.set([...current]);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading.set(true);
      const body = {
        password: this.form.value.password,
        password_confirm: this.form.value.password_confirm
      };
      this.authService.resetPassword(this.token, body).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.success.set(true);
          this.toastr.success('Mot de passe réinitialisé avec succès', 'Succès');
          setTimeout(() => this.router.navigate([routes.login]), 2000);
        },
        error: (err) => {
          this.isLoading.set(false);
          const message = err.error?.message || 'Lien invalide ou expiré';
          this.toastr.error(message, 'Erreur');
        }
      });
    }
  }
}
