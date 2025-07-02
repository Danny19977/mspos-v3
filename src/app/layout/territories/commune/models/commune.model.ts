import { IArea } from "../../areas/models/area.model";
import { ICountry } from "../../country/models/country.model"; 
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";

export interface ICommune {
    ID?: number;
    uuid: string;
    name: string;

    country_uuid: string;
    province_uuid: string;
    area_uuid: string;
    sub_area_uuid: string;

    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    Country: ICountry;
    Province: IProvince;
    Area: IArea;
    SubArea: ISubArea

    // Cyclos: ICyclo[];
    // Pos: IPos[];
    // PosForms: IPosForm[];
    // Users: IUser[];

    total_users: number;
    total_pos: number;
    total_posforms: number;
}
