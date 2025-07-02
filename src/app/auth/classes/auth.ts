import { EventEmitter } from "@angular/core";    
import { IUser } from "../../layout/management/user/models/user.model";

export class Auth {
    static userEmitter = new EventEmitter<IUser>();
}