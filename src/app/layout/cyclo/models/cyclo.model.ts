import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { IDr } from "../../dr/models/dr.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IPosForm } from "../../posform/models/posform.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";

export interface ICyclo {
    ID: number;
    uuid: string;
    country_uuid: string;
    province_uuid: string;
    area_uuid: string;
    subarea_uuid: string;
    commune_uuid: string;
    asm_uuid: string;
    sup_uuid: string;
    dr_id: number;
    user_uuid: string;
    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    Country: ICountry;
    Province: IProvince;
    Area: IArea;
    SubArea: ISubArea;
    Commune: ICommune;
    Asm: IAsm;
    Sup: ISup;
    Dr: IDr;
    User: IUser;

    Pos: IPos[];
    PosForms: IPosForm[];
}
