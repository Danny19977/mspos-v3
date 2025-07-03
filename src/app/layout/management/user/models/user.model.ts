import { IPos } from "../../../market/pos-vente/models/pos.model";
import { IPosForm } from "../../../market/posform/models/posform.model";
import { IRoutePlan } from "../../../market/routeplan/models/routeplan.model";
import { IArea } from "../../../territories/areas/models/area.model";
import { ICommune } from "../../../territories/commune/models/commune.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IProvince } from "../../../territories/province/models/province.model";
import { ISubArea } from "../../../territories/subarea/models/subarea.model";
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
    sub_area_uuid: string;
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
    total_pos: number;
    visites: number;
 
    UserLogs?: UserLogsModel[];
    RoutePlan?: IRoutePlan[];
    PosForms?: IPosForm[]; // Assuming PosForms is an array of any type, adjust as necessary
    Pos?: IPos[]; // Assuming Pos is an array of any type, adjust as necessary

}
