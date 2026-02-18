import { Component, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { routes } from '../../shared/routes/routes';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AuthService } from '../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LogsService } from '../../layout/management/user-logs/logs.service';
import { NetworkService } from '../../services/network.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  // Services avec inject()
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly logActivity = inject(LogsService);
  private readonly toastr = inject(ToastrService);
  private readonly networkService = inject(NetworkService);

  // Signals pour l'état du composant
  readonly dateY = formatDate(new Date(), 'yyyy', 'en');
  readonly routes = routes;
  readonly isLoading = signal(false);
  readonly password = signal<boolean[]>([false]);
  readonly isOnline = signal(this.networkService.isOnline());

  form!: FormGroup;

  constructor() {
    // Observer l'état du réseau
    this.networkService.getNetworkStatus()
      .pipe(takeUntilDestroyed())
      .subscribe(status => {
        this.isOnline.set(status);
      });
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      identifier: ['', Validators.required], // Changed from 'email' to 'identifier'
      password: ['', Validators.required]
    });
  }


  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading.set(true);
      
      const body = {
        identifier: this.form.value.identifier.toLowerCase(),
        password: this.form.value.password
      };

      this.authService.login(body).subscribe({
        next: (res) => {
          console.log('✅ Login réussi:', res);
          
          // Si on est en mode offline, on peut passer directement à la récupération des données
          const isOfflineMode = res.offline === true;
          
          if (isOfflineMode) {
            // Mode OFFLINE : charger les données depuis IndexedDB
            this.toastr.success('Connecté en mode hors ligne', 'Succès');
          }

          // Récupérer les informations utilisateur (online ou offline)
          this.authService.user().subscribe({
            next: (user) => {
              // Ne logger l'activité qu'en mode online
              if (!isOfflineMode) {
                this.logActivity.activity(
                  'Login',
                  user.uuid,
                  'login',
                  'Login Authentification',
                  user.fullname
                ).subscribe({
                  next: () => {
                    this.redirectUser(user, isOfflineMode);
                  },
                  error: (err) => {
                    console.error('❌ Erreur lors du log d\'activité:', err);
                    // Rediriger quand même
                    this.redirectUser(user, isOfflineMode);
                  }
                });
              } else {
                // En mode offline, rediriger directement
                this.redirectUser(user, isOfflineMode);
              }
            },
            error: (error) => {
              this.isLoading.set(false);
              this.toastr.error('Impossible de charger les données utilisateur', 'Erreur');
              console.error('❌ Erreur user():', error);
            }
          });
        },
        error: (e) => {
          this.isLoading.set(false);
          console.error('❌ Erreur login:', e);
          
          const errorMessage = e.error?.message || 'Erreur d\'authentification';
          
          this.toastr.error(errorMessage, 'Échec de connexion');
        }
      });
    }
  }

  /**
   * Redirige l'utilisateur selon son rôle
   */
  private redirectUser(user: any, isOfflineMode: boolean): void {
    const welcomeMessage = isOfflineMode 
      ? `Bienvenue ${user.fullname}! (Mode hors ligne) 📴` 
      : `Bienvenue ${user.fullname}! 🎉`;
    
    this.toastr.success(welcomeMessage, 'Succès');
    this.isLoading.set(false);

    // Redirection selon le rôle
    if (user.role === 'Manager' || user.role === 'ASM' || user.role === 'Supervisor') {
      this.router.navigate([routes.ndDashboard]);
    } else if (user.role === 'DR' || user.role === 'Cyclo') {
      this.router.navigate([routes.posFormList]);
    } else if (user.role === 'Support') {
      this.router.navigate([routes.userLogsList]);
    } else {
      this.router.navigate(['/auth/login']);
      this.toastr.error('Vous n\'avez pas accès à cette application', 'Accès refusé');
    }
  }

  private navigate() {
    this.router.navigate([routes.msposDashboard]);
  }

  public togglePassword(index: number) {
    const current = this.password();
    current[index] = !current[index];
    this.password.set([...current]);
  }
}
