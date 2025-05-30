import { IArea } from "../../areas/models/area.model"; 
import { IBrand } from "../../brand/models/brand.model";
import { ICommune } from "../../commune/models/commune.model"; 
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model"; 

export interface ICountry {
    ID: number;
    uuid: string;
    name: string;
    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    Provinces: IProvince[];
    Areas: IArea[];
    Subareas: ISubArea[];
    Communes: ICommune[]; 
    Brands: IBrand[];
    // Pos: IPos[];
    // Users: IUser[];

    total_users: number;
    total_pos: number;
    total_posforms: number;
}