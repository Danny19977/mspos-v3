import { Component, OnInit } from '@angular/core';
import { routes } from '../../shared/routes/routes';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AuthService } from '../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LogsService } from '../../layout/management/user-logs/logs.service';
import { NetworkService } from '../../services/network.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  dateY = "";
  public routes = routes;
  isLoading = false;

  form!: FormGroup;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private logActivity: LogsService,
    private toastr: ToastrService,
    private networkService: NetworkService,
    private syncService: SyncService // Injection du service de synchronisation
  ) {
    this.dateY = formatDate(new Date(), 'yyyy', 'en');
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      identifier: ['', Validators.required], // Changed from 'email' to 'identifier'
      password: ['', Validators.required]
    });
  }


  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      
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
              // Logger l'activité
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
            },
            error: (error) => {
              this.isLoading = false;
              this.toastr.error('Impossible de charger les données utilisateur', 'Erreur');
              console.error('❌ Erreur user():', error);
            }
          });
        },
        error: (e) => {
          this.isLoading = false;
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
    this.isLoading = false;

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
  public password: boolean[] = [false];

  public togglePassword(index: any) {
    this.password[index] = !this.password[index]
  }
}
