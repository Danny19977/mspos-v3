import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IManager } from "../../managers/models/manager.model";
import { IProvince } from "../../province/models/province.model";
import { IRoutePlan } from "../../routeplan/models/routeplan.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { UserLogsModel } from "../../user-logs/models/user-logs.model";

export interface IUser {
    ID: number;
    uuid: string;
    fullname: string;
    email: string;
    title: string;
    phone: string;
    password: string;
    password_confirm: string;

    country_uuid: string;
    Country: ICountry;
    province_uuid: string;
    Province: IProvince;
    area_uuid: string;
    Area: IArea;
    subarea_uuid: string;
    SubArea: ISubArea;
    commune_uuid: string;
    Commune: ICommune;

    support_uuuid: string;
    support: string;
    manager_uuid: string;
    manager: string;
    asm_uuid: string;
    asm: string;
    sup_uuid: string;
    sup: string;
    dr_uuid: string;
    dr: string;
    cyclo_uuid: string;
    cyclo: string;

    role: string; // Idem with title
    permission: string;
    image: string;
    status: boolean;

    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    total_asm: number;
    total_sup: number; 
    total_dr: number;
    total_cyclo: number;

    Manager?: IManager[];
    UserLogs?: UserLogsModel[];
    RoutePlan?: IRoutePlan[];


}
