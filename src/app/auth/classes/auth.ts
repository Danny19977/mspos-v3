import { EventEmitter } from "@angular/core";    
import { IUser } from "../../layout/user/models/user.model";

export class Auth {
    static userEmitter = new EventEmitter<IUser>();
}