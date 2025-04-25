import { IPos } from "../../pos-vente/models/pos.model"; 
import { IRoutePlan } from "./routeplan.model";

export interface IRoutePlanItem {
    ID?: number;
    id?: number;
    uuid?: string;
    
    routplan_uuid: string;
    pos_uuid: string;
    pos_name?: string;
    pos_gerant?: string;
    pos_shop?: string;
    postype?: string;

    status: boolean;

    CreatedAt?: Date;
    UpdatedAt?: Date;

    RoutePlan?: IRoutePlan;
    Pos?: IPos;
}
