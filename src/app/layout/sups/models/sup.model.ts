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

    country_uuid: string; 
    province_uuid: string;
    area_uuid: string;

    asm_uuid: string; 
    user_uuid: string;


    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    Country: ICountry;
    Province: IProvince;
    Area: IArea;
    
    Asm: IAsm;
    User: IUser;

    Drs: IDr[];
    Cyclos: ICyclo[]
    
    PosForms: IPosForm[];
    Pos: IPos[];

}
