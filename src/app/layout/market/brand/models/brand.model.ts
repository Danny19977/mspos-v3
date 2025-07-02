import { IPosFormItem } from "../../posform/models/posform_item.model";
import { ICountry } from "../../../territories/country/models/country.model";
import { IProvince } from "../../../territories/province/models/province.model";


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
