import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { IBrand } from "../../brand/models/brand.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IPosForm } from "../../posform/models/posform.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";

export interface IProvince { 
    ID: number;
    uuid: string; 
    name: string; 
    country_uuid: string;
    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    Country: ICountry;
    
    Areas: IArea[];
    Subareas: ISubArea[];
    Communes: ICommune[];

    Brands: IBrand[];
    Posforms: IPosForm[];

    Asms: IAsm[]; 
    Sups: ISup[];
    Drs: IDr[];
    Cyclos: ICyclo[];

    Users: IUser[];

}

export interface IProvinceDropdown {
    uuid: string;
    name: string; 
}  