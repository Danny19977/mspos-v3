import { IArea } from "../../areas/models/area.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { IUser } from "../../user/models/user.model";

export interface ICyclo {
    ID?: number;
    uuid?: string;

    title: string;
    fullname?: string;
    asm_fullname?: string;
    sup_fullname?: string;
    dr_fullname?: string;

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
    Asm?: IUser;
    sup_uuid: string;
    Sup?: IUser;
    dr_uuid: string;
    Dr?: IUser;


    signature: string;
    CreatedAt?: Date;
    UpdatedAt?: Date;

    Users?: IUser[];
    // Pos: IPos[];
    // PosForms: IPosForm[];
}
