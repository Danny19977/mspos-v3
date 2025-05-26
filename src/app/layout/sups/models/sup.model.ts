import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model"; 
import { IPos } from "../../pos-vente/models/pos.model";
import { IPosForm } from "../../posform/models/posform.model";
import { IProvince } from "../../province/models/province.model";
import { IUser } from "../../user/models/user.model";

export interface ISup {
    ID: number;
    uuid: string;

    title: string;
    fullname?: string;
    asm_fullname?: string;
 
    country_uuid: string;
    Country: ICountry;
    province_uuid: string;
    Province: IProvince;
    area_uuid: string;
    Area: IArea;

    asm_uuid: string;
    Asm: IAsm;

    User?: IUser;

    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    // Users?: IUser[];
    Drs?: IDr[];
    Cyclos?: ICyclo[];
    PosForms: IPosForm[];
    Pos: IPos[];

}
