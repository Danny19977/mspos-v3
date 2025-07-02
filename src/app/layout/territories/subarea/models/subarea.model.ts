import { IArea } from "../../areas/models/area.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { IProvince } from "../../province/models/province.model";

export interface ISubArea {
    ID: number;
    uuid: string;

    name: string;

    country_uuid: string;
    province_uuid: string;
    area_uuid: string;
    signature: string;

    CreatedAt: Date;
    UpdatedAt: Date;

    Country: ICountry;
    Province: IProvince;
    Area: IArea;

    Commune: ICommune[];
    // Sup: ISup[];
    // Dr: IDr[];
    // Cyclo: ICyclo[];
    // User: IUser[];

    total_users: number;
    total_pos: number;
    total_posforms: number;
}