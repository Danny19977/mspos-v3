import { IArea } from "../../areas/models/area.model";
import { ICommune } from "../../commune/models/commune.model";
import { ICountry } from "../../country/models/country.model";
import { IPosForm } from "../../../market/posform/models/posform.model";
import { ISubArea } from "../../subarea/models/subarea.model";
import { IUser } from "../../../management/user/models/user.model";
import { IBrand } from "../../../market/brand/models/brand.model";

export interface IProvince {
  ID: number;
  uuid: string;
  name: string;
  country_uuid: string;
  signature: string;
  CreatedAt: Date;
  UpdatedAt: Date;

  Country: ICountry;

  Areas: IArea[];
  Subareas: ISubArea[];
  Communes: ICommune[];

  Brands: IBrand[];
  // Posforms: IPosForm[];

  // Asms: IAsm[]; 
  // Sups: ISup[];
  // Drs: IDr[];
  // Cyclos: ICyclo[];

  // Users: IUser[];

  total_users: number;
  total_pos: number;
  visites: number;

}

export interface IProvinceDropdown {
  uuid: string;
  name: string;
}  