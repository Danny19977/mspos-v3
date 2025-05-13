import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IManager } from "../../managers/models/manager.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { UserLogsModel } from "../../user-logs/models/user-logs.model";

export interface IUser {
    ID: number;
    uuid: string;
    fullname: string;
    email: string;
    title: string;
    phone: string;
    password: string;
    password_confirm: string;

    country_uuid: string;
    province_uuid: string;
    area_uuid: string;
    subarea_uuid: string;
    commune_uuid: string;

    role: string; // Idem with title
    permission: string;
    image: string;
    status: boolean;

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
    Cyclo: ICyclo;

    Manager: IManager[];
    UserLogs: UserLogsModel[];

    
    country_name: string; 
    province_name: string; 
    area_name: string; 
    subarea_name: string; 
    commune_name: string;

    asm_uuid: string;
    asm_fullname: string;
    sup_uuid: string;
    sup_fullname: string;
    dr_uuid: string;
    dr_fullname: string;
    cyclo_uuid: string;
    cyclo_fullname: string;
    

}
