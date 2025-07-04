import { IUser } from "../../../management/user/models/user.model";
import { IArea } from "../../../territories/areas/models/area.model";
import { ICommune } from "../../../territories/commune/models/commune.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IProvince } from "../../../territories/province/models/province.model";
import { ISubArea } from "../../../territories/subarea/models/subarea.model";
import { IRoutePlanItem } from "./routeplanItem.model"; 

export interface IRoutePlan {
    ID?: number;
    uuid?: string;

    user_uuid: string;
    User?: IUser;

    country_uuid: string;
    Country?: ICountry;
    province_uuid: string;
    Province?: IProvince;
    area_uuid: string;
    Area?: IArea;
    sub_area_uuid: string;
    Subarea?: ISubArea;
    commune_uuid: string;
    Commune?: ICommune; 

    signature: string;
    CreatedAt?: Date;
    UpdatedAt?: Date;

    // total_route_plan_item_active?: number;
    // total_route_plan_item?: number;

    RoutePlanItems?: IRoutePlanItem[];

}
