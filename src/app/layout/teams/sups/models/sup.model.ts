import { IUser } from "../../../management/user/models/user.model";
import { IPos } from "../../../market/pos-vente/models/pos.model";
import { IPosForm } from "../../../market/posform/models/posform.model";
import { IArea } from "../../../territories/areas/models/area.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IProvince } from "../../../territories/province/models/province.model";
import { IAsm } from "../../asm/models/asm.model"; 
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";  

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
