import { ICountry } from "../../country/models/country.model";
import { IUser } from "../../user/models/user.model";

export interface IManager {
    ID: number;
    uuid: string;
    title: string;
    country_uuid: string;
    user_uuid: string;
    signature: string;

    CreatedAt: Date;
    UpdatedAt: Date;

    Country: ICountry;
    User: IUser;
}
