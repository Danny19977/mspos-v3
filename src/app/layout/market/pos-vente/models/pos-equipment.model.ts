import { IPos } from "./pos.model";

export interface IPosEquipment {
    uuid?: string;

    pos_uuid: number;
    Pos: IPos;

    parasol: string; // Dropdown des brands // ajouter une ligne une ligne pour "Autres"
    parasol_status: string; // Caassser, Vieux, Bien

    stand : string; // Dropdown des brands // ajouter une ligne une ligne pour "Autres"
    stand_status: string;

    kiosk: string; // Dropdown des brands // ajouter une ligne une ligne pour "Autres"
    kiosk_status: string;

    CreatedAt: Date;
    UpdatedAt: Date;
 
}