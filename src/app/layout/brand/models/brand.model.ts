import { ICountry } from "../../country/models/country.model";
import { IPosFormItem } from "../../posform/models/posform_item.model";
import { IProvince } from "../../province/models/province.model";

export interface IBrand {
    ID?: number; // For cloud storage
    id?: number; // For local storage
    uuid?: string;
    name: string;
    country_uuid: string;
    province_uuid: string;
    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    Country?: ICountry;
    Province?: IProvince;

    PosFormItems?: IPosFormItem[];
}
