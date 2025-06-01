import { IPos } from "../../pos-vente/models/pos.model"; 
import { IRoutePlan } from "./routeplan.model";

export interface IRoutePlanItem {
    ID?: number; 
    uuid?: string;
    
    routeplan_uuid: string;
    pos_uuid: string; 

    status: boolean;

    CreatedAt?: Date;
    UpdatedAt?: Date;

    RoutePlan?: IRoutePlan;
    Pos?: IPos;
}
