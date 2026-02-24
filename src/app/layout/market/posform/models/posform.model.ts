import { IPos } from "../../pos-vente/models/pos.model";
import { IProvince } from "../../../territories/province/models/province.model";
import { IUser } from "../../../management/user/models/user.model";
import { IPosFormItem } from "./posform_item.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IArea } from "../../../territories/areas/models/area.model";
import { ISubArea } from "../../../territories/subarea/models/subarea.model";
import { ICommune } from "../../../territories/commune/models/commune.model";

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
    sub_area_uuid: string;
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


    // sync: boolean; // pour savoir si le posform est synchronisé ou non
    signature: string;

    // Offline sync fields
    sync_status?: 'synced' | 'pending' | 'error' | 'deleted';
    temp_id?: string; // Temporary UUID for offline-created entities

    CreatedAt?: Date;
    UpdatedAt?: Date;
 

    PosFormItems?: IPosFormItem[];
}