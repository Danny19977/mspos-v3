import { Component, Input } from '@angular/core';
import { IUser } from '../../../layout/user/models/user.model';
import { UserService } from '../../../layout/user/user.service';

@Component({
  selector: 'app-user-get',
  standalone: false,
  templateUrl: './user-get.component.html',
  styleUrl: './user-get.component.scss'
})
export class UserGetComponent {
  @Input() uuid!: string;
   
    user!: IUser;
   
    constructor(private userService: UserService) {}
   
     ngOnInit(): void {
       this.userService.get(this.uuid).subscribe(res => {
         this.user = res.data;
       })
     }
}
