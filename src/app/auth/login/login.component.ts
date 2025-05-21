import { Component, OnInit } from '@angular/core';
import { routes } from '../../shared/routes/routes';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AuthService } from '../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LogsService } from '../../layout/user-logs/logs.service';

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
    private toastr: ToastrService
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
      var body = {
        identifier: this.form.value.identifier.toLowerCase(), // Changed from 'email' to 'identifier'
        password: this.form.value.password
      };

      this.authService.login(body).subscribe({
        next: (res) => {
          console.log(res);
          // localStorage.removeItem("auth_id");
          // localStorage.setItem("auth_id", res.data);

          this.authService.user().subscribe({
            next: (user) => {
              this.logActivity.activity(
                'Login',
                user.uuid,
                'login',
                'Login Authentification',
                user.fullname
              ).subscribe({
                next: () => {
                  if (user.role == 'Manager') {
                    this.router.navigate([routes.ndDashboard]);
                  } else if (user.role == 'ASM') {
                    this.router.navigate([routes.ndDashboard]);
                  } else if (user.role == 'Supervisor') {
                    this.router.navigate([routes.ndDashboard]);
                  } else if (user.role == 'DR') {
                    this.router.navigate([routes.posFormList]);
                  }  else if (user.role == 'Cyclo') {
                    this.router.navigate([routes.posFormList]);
                  } else if (user.role == 'Support') {
                    this.router.navigate([routes.userLogsList]);
                  } else {
                    this.router.navigate(['/auth/login']);
                    this.toastr.error('Vous n\'avez pas accès à cette application', 'Oupss!');
                    this.isLoading = false;
                  }
                  this.toastr.success(`Bienvenue ${user.fullname}! 🎉`, 'Success!');
                  this.isLoading = false;
                },
                error: (err) => {
                  this.isLoading = false;
                  this.toastr.error(`${err.error.message}`, 'Oupss!');
                  console.log(err);
                }
              });
            },
            error: (error) => {
              this.isLoading = false;
              this.router.navigate(['/auth/login']);
              console.log(error);
            }
          });
        },
        error: (e) => {
          this.isLoading = false;
          console.error(e);
          this.toastr.error(`${e.error.message}`, 'Oupss!');
          this.router.navigate(['/auth/login']);
        },
      }
      )
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
