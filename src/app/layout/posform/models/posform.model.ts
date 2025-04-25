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
import { IPosFormItem } from "./posform_item.model";

export interface IPosForm {
    id?: number; // pour db local
    ID?: number; // pour db remote
    uuid?: string;

    price: number;
   
    comment: string;

    latitude: string;
    longitude: string;

    pos_uuid: string;
    pos_name?: string;

    country_uuid: string;
    country_name?: string;
    province_uuid: string;
    province_name?: string;
    area_uuid: string;
    area_name?: string;
    subarea_uuid: string;
    subarea_name?: string;
    commune_uuid: string;
    commune_name?: string;

    asm_uuid: string;
    asm_fullname?: string;
    sup_uuid: string;
    sup_fullname?: string;
    dr_uuid: string;
    dr_fullname?: string;
    cyclo_uuid: string;
    cyclo_fullname?: string;
    
    sync: boolean; // pour savoir si le posform est synchronisé ou non
    signature: string;

    CreatedAt?: Date;
    UpdatedAt?: Date; 

    Pos?: IPos;

    Country?: ICountry;
    Province?: IProvince;
    Area?: IArea;
    SubArea?: ISubArea;
    Commune?: ICommune;

    ASM?: IAsm;
    Sup?: ISup;
    Dr?: IDr;
    Cyclo?: ICyclo;

    PosFormItems?: IPosFormItem[];
}