import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonService } from '../../shared/common/common.service';
import { Router } from '@angular/router';
import { routes } from '../../shared/routes/routes';
import { AuthService } from '../auth.service';
import { IUser } from '../../layout/user/models/user.model';

@Component({
  selector: 'app-lock-screen',
  standalone: false,
  templateUrl: './lock-screen.component.html',
  styleUrl: './lock-screen.component.scss'
})
export class LockScreenComponent implements OnInit, OnDestroy {
  public routes = routes;
  public password : boolean[] = [false];

  currentUser!: IUser;
 

  public togglePassword(index: any){
    this.password[index] = !this.password[index]
  }

  base = '';
  page = '';
  last = '';
  constructor(
    private common: CommonService,
    public authService: AuthService,
    private renderer: Renderer2,
    private router: Router
  ) {
    this.common.base.subscribe((res: string) => {
      this.base = res;
    });
    this.common.page.subscribe((res: string) => {
      this.page = res;
    });
    this.common.last.subscribe((res: string) => {
      this.last = res;
    });
    if (this.base == 'lock-screen') {
      this.renderer.addClass(document.body, 'account-page');
    }
  }
  
  ngOnInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user; 
      },
      error: (error) => {  
        console.log(error);
      }
    });
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'account-page');
  }
  
  public navigate() {
    this.router.navigate(["/web/posforms"]);
  }
}

