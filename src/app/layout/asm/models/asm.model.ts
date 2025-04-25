import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IPosForm } from "../../posform/models/posform.model";
import { IProvince } from "../../province/models/province.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";

export interface IAsm {
    ID: number;
    uuid: string;

    country_uuid: string;
    province_uuid: string;
    user_uuid: string;

    signature: string;

    CreatedAt: Date;
    UpdatedAt: Date;

    Country: ICountry;
    Province: IProvince;
    User: IUser;

    Sups: ISup[];
    Drs: IDr[];
    Cyclos: ICyclo[];

    Pos: IPos[];
    PosForms: IPosForm[];
}
