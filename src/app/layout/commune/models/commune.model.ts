import { IArea } from "../../areas/models/area.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IPosForm } from "../../posform/models/posform.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { IUser } from "../../user/models/user.model";

export interface ICommune {
    ID?: number;
    uuid: string;
    name: string;

    country_uuid: string;
    province_uuid: string;
    area_uuid: string;
    subarea_uuid: string;

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
