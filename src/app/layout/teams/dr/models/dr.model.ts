import { IUser } from "../../../management/user/models/user.model";
import { IPos } from "../../../market/pos-vente/models/pos.model";
import { IPosForm } from "../../../market/posform/models/posform.model";
import { IArea } from "../../../territories/areas/models/area.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IProvince } from "../../../territories/province/models/province.model";
import { ISubArea } from "../../../territories/subarea/models/subarea.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { ISup } from "../../sups/models/sup.model";

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
    Sup?: ISup; 

    User?: IUser;

    signature: string;

    CreatedAt?: Date;
    UpdatedAt?: Date;
 
    Cyclos?: ICyclo[]; // Assuming Cyclo is a type of user, adjust as necessary
    Pos?: IPos[];
    PosForms?: IPosForm[];
}
