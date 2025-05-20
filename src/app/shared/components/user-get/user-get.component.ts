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

  isload = false;

  user!: IUser;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.isload = true;
    if (this.uuid) {
      this.userService.get(this.uuid).subscribe(res => {
        this.user = res.data;
        this.isload = false;
      });
    } else {
      this.isload = false;
    }
  }
}
