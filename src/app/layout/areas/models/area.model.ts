import { ICommune } from "../../commune/models/commune.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IPosForm } from "../../posform/models/posform.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";


export interface IArea {
    ID: number; 
    uuid: string;
    name: string;
    
    country_uuid: string;
    province_uuid: string;

    signature: string; 
    CreatedAt: Date;
    UpdatedAt: Date; 

    Country: string;
    Province: string;

    SubAreas: ISubArea[];
    Communes: ICommune[];
    Sups: ISup[];
    Pos: IPos[];
    PosForms: IPosForm[];
    Users: IUser[];
    


  
}

export interface IAreaDropdown {
    ID: number;
    name: string; 
    province_uuid: string;
    commune: string[];
}  
 