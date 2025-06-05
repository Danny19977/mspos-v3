import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IPosForm } from "../../posform/models/posform.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";
import { IPosEquipment } from "./posequipment.model";

export interface IPos {
    ID?: number;
    id?: number;
    uuid?: string;

    name: string;
    shop: string;
    postype: string;  // Gros, Detail, Mixte
    gerant: string; // Gerant du point de vente
    avenue: string;
    quartier: string;
    reference: string;
    telephone: string;

    country_uuid: string;
    country_name?: string;
    province_uuid: string;
    province_name?: string;
    area_uuid: string;
    area_name?: string;
    sub_area_uuid: string;
    subarea_name?: string;
    commune_uuid: string;
    commune_name?: string;

    user_uuid: string;
    User?: IUser;

    asm_uuid: string;
    asm: string;
    sup_uuid: string;
    sup: string;
    dr_uuid: string;
    dr: string;
    cyclo_uuid: string;
    cyclo: string;

    status: boolean;
    signature: string;
    CreatedAt?: Date;
    UpdatedAt?: Date;

    sync: boolean;

    Country?: ICountry;
    Province?: IProvince;
    Area?: IArea;
    SubArea?: ISubArea;
    Commune?: ICommune;



    PosEquipements?: IPosEquipment[];
    PosForms?: IPosForm[];
}   
