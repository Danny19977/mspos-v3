import { ICommune } from "../../commune/models/commune.model"; 
import { ISubArea } from "../../subarea/models/subarea.model";


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
    // Sups: ISup[];
    // Pos: IPos[];
    // PosForms: IPosForm[];
    // Users: IUser[];

    total_users: number;
    total_pos: number;
    visites: number;


}

export interface IAreaDropdown {
    ID: number;
    name: string;
    province_uuid: string;
    commune: string[];
}
