import { IArea } from "../../areas/models/area.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { IUser } from "../../user/models/user.model";
import { IRoutePlanItem } from "./routeplanItem.model";

export interface IRoutePlan {
    ID?: number;
    id?: number;
    uuid?: string;
    
    user_uuid: string;
    User?: IUser;
    user_fullname?: string;

    country_uuid: string;
    country_name?: string;
    province_uuid: string;
    province_name?: string;
    area_uuid: string;
    area_name?: string;
    subarea_uuid: string;
    subarea_name?: string;
    commune_uuid: string;
    commune_name?: string;

    // total_pos: number;

    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;
    

    Country?: ICountry;
    Province?: IProvince;
    Area?: IArea;
    Subarea?: ISubArea;
    Commune?: ICommune; 

    RoutePlanItems?: IRoutePlanItem[];
    
}
