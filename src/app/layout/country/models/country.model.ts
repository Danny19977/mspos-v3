import { IArea } from "../../areas/models/area.model";
import { IAsm } from "../../asm/models/asm.model";
import { IBrand } from "../../brand/models/brand.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICyclo } from "../../cyclo/models/cyclo.model";
import { IDr } from "../../dr/models/dr.model";
import { IManager } from "../../managers/models/manager.model";
import { IPos } from "../../pos-vente/models/pos.model";
import { IProvince } from "../../province/models/province.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { ISup } from "../../sups/models/sup.model";
import { IUser } from "../../user/models/user.model";

export interface ICountry {
    ID: number;
    uuid: string;
    name: string;
    signature: string;
    CreatedAt: Date;
    UpdatedAt: Date;

    Provinces: IProvince[];
    Areas: IArea[];
    Subareas: ISubArea[];
    Communes: ICommune[];
    Managers: IManager[]; 
    Asms: IAsm[];
    Sups: ISup[];
    Drs: IDr[];
    Cyclos: ICyclo[];
    Brands: IBrand[];
    Pos: IPos[];
    Users: IUser[];
}