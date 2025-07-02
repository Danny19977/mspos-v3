import { IUser } from "../../../management/user/models/user.model";
import { IPos } from "../../../market/pos-vente/models/pos.model";
import { IPosForm } from "../../../market/posform/models/posform.model";
import { IArea } from "../../../territories/areas/models/area.model";
import { ICommune } from "../../../territories/commune/models/commune.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IProvince } from "../../../territories/province/models/province.model";
import { ISubArea } from "../../../territories/subarea/models/subarea.model";

export interface ICyclo {
    ID?: number;
    uuid?: string;

    title: string; 

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
    Asm?: IUser;
    sup_uuid: string;
    Sup?: IUser;
    dr_uuid: string;
    Dr?: IUser;

    User?: IUser;

    signature: string;
    CreatedAt?: Date;
    UpdatedAt?: Date;

    // Users?: IUser[];
    Pos?: IPos[];
    PosForms?: IPosForm[];
}
