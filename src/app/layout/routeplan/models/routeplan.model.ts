import { IArea } from "../../areas/models/area.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { IUser } from "../../user/models/user.model";
import { IRoutePlanItem } from "./routeplanItem.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { ISup } from "../../sups/models/sup.model";

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
    subarea_uuid: string;
    Subarea?: ISubArea;
    commune_uuid: string;
    Commune?: ICommune; 

    signature: string;
    CreatedAt?: Date;
    UpdatedAt?: Date;

    total_route_plan_item_active?: number;
    total_route_plan_item?: number;

    RoutePlanItems?: IRoutePlanItem[];

}
