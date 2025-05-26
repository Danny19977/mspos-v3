import { IArea } from "../../areas/models/area.model"; 
import { IAsm } from "../../asm/models/asm.model";
import { ICountry } from "../../country/models/country.model"; 
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model"; 
import { IPos } from "../../pos-vente/models/pos.model";
import { IPosForm } from "../../posform/models/posform.model";
import { IUser } from "../../user/models/user.model";

export interface IDr {
    ID?: number;
    uuid?: string;

    title: string; 

    country_uuid: string;
    Country?: ICountry;
    province_uuid: string;
    Province?: IProvince;
    area_uuid: string;
    Area?: IArea;
    subarea_uuid: string;
    SubArea?: ISubArea;

    asm_uuid: string;
    Asm?: IAsm;
    sup_uuid: string;
    Sup?: IAsm; 

    User?: IUser;

    signature: string;

    CreatedAt?: Date;
    UpdatedAt?: Date;
 
    Cyclos?: ICyclo[]; // Assuming Cyclo is a type of user, adjust as necessary
    Pos?: IPos[];
    PosForms?: IPosForm[];
}
