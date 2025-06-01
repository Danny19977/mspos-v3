import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";
import { IPosFormItem } from "./posform_item.model";

export interface IPosForm {
    id?: number; // pour db local
    ID?: number; // pour db remote
    uuid?: string;

    price: number;

    comment: string;

    latitude?: number;
    longitude?: number;

    pos_uuid?: string;
    Pos?: IPos;

    user_uuid: string; // uuid de l'utilisateur qui a rempli le posform
    User?: IUser;

    country_uuid: string;
    Country?: ICountry;
    province_uuid: string;
    Province?: IProvince;
    area_uuid: string;
    Area?: IArea;
    subarea_uuid: string;
    SubArea?: ISubArea;
    commune_uuid: string;
    Commune?: ICommune;

    asm_uuid: string;
    asm: string;
    sup_uuid: string;
    sup: string;
    dr_uuid: string;
    dr: string;
    cyclo_uuid: string;
    cyclo: string;


    sync: boolean; // pour savoir si le posform est synchronisé ou non
    signature: string;

    CreatedAt?: Date;
    UpdatedAt?: Date;
 

    PosFormItems?: IPosFormItem[];
}