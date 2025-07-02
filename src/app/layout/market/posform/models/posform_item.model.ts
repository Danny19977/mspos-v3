import { IBrand } from "../../brand/models/brand.model";
import { IPosForm } from "./posform.model";

export interface IPosFormItem {
    ID?: number;
    id?: number; // pour db local
    uuid?: string;
    
    posform_uuid: string;
    brand_uuid: string; 
    brand_name?: string;
   
    number_farde: number; // Nombre des frades trouvees sur terrain 
    counter: number; // permet le calcul de la somme pour le ND dashboard
    sold: number;

    CreatedAt?: Date;
    UpdatedAt?: Date;
 
    PosForm?: IPosForm;
    Brand?: IBrand; 
}
