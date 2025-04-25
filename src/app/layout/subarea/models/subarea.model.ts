import { IArea } from "../../areas/models/area.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IProvince } from "../../province/models/province.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";

export interface ISubArea {
    ID: number;
    uuid: string;
    
    name: string;
    
    country_uuid: string;
    province_uuid: string;
    area_uuid: string;
    signature: string; 

    CreatedAt: Date;
    UpdatedAt: Date; 

    Country: ICountry;
    Province: IProvince;
    Area: IArea;

    Commune: ICommune[];
    Sup: ISup[];
    Dr: IDr[];
    Cyclo: ICyclo[];
    User: IUser[];
}