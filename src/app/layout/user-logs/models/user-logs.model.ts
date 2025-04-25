import { IUser } from "../../user/models/user.model";

export interface UserLogsModel {
    ID?: number;
    uuid?: string;
    name: string;
    
    user_uuid: string;
    User?: IUser;

    action: string;
    description: string;
    signature: string;
    created_at: Date;
    updated_at: Date;

    fullname?: string;
    title?: string; 
}

export interface UserLogsSubmit {
    name: string;
    user_uuid: string;
    action: string;
    description: string;
    signature: string;
}