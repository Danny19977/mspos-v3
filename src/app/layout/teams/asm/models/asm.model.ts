import { IUser } from "../../../management/user/models/user.model";
import { IPos } from "../../../market/pos-vente/models/pos.model";
import { IPosForm } from "../../../market/posform/models/posform.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IProvince } from "../../../territories/province/models/province.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model"; 
import { ISup } from "../../sups/models/sup.model"; 

export interface IAsm {
    uuid?: string;

    title: string;
    fullname?: string;
    User?: IUser;

    country_uuid: string;
    Country?: ICountry;
    province_uuid: string;
    Province?: IProvince;

    signature: string;

    CreatedAt?: Date;
    UpdatedAt?: Date;

    // Users?: IUser[];
    
    Sups?: ISup[];
    Drs?: IDr[];
    Cyclo?: ICyclo[];

    Pos?: IPos[];
    PosForms?: IPosForm[];
}
