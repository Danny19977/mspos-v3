import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IPosForm } from "../../posform/models/posform.model";
import { IProvince } from "../../province/models/province.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";

export interface IAsm {
    uuid?: string;

    title: string;
    fullname?: string;

    country_uuid: string;
    Country?: ICountry;
    province_uuid: string;
    Province?: IProvince;

    signature: string;

    CreatedAt?: Date;
    UpdatedAt?: Date;

    Users?: IUser[];
    
    Sups?: ISup[];
    Drs?: IDr[];
    Cyclo?: ICyclo[];

    Pos?: IPos[];
    PosForms?: IPosForm[];
}
