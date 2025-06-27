import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { routes } from '../../../shared/routes/routes';
import { IUser } from '../models/user.model';
import { AuthService } from '../../../auth/auth.service';

@Component({
    selector: 'app-user-view',
    standalone: false,
    templateUrl: './user-view.component.html',
    styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
    isLoadingData = false;
    public routes = routes;
    currentUser!: IUser;

    userUUID!: string;
    user!: IUser;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private usersService: UserService,
    ) { }


    ngOnInit(): void {
        this.isLoadingData = true;
        this.route.params.subscribe(params => {
            this.userUUID = params['uuid'];
            this.authService.user().subscribe({
                next: (user) => {
                    this.currentUser = user;
                    this.usersService.get(this.userUUID).subscribe(item => {
                        this.user = item.data;
                        this.isLoadingData = false;
                        console.log("User view", this.user);
                    });
                },
                error: (error) => {
                    this.isLoadingData = false;
                    this.router.navigate(['/auth/login']);
                    console.log(error);
                }
            });

        });
    }
}
