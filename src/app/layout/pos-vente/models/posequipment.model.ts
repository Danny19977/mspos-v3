import { IPos } from "./pos.model";

export interface IPosEquipment {
    ID: number;
    uuid?: string;

    pos_id: number;
    Pos: IPos;

    parasol: string; // Dropdown de brands // ajouter une ligne une ligne pour "Autres"
    parasol_status: string; // Caassser, Vieux, Bien

    stand : string; // Dropdown de brands // ajouter une ligne une ligne pour "Autres"
    stand_status: string;

    kiosk: string; // Dropdown de brands // ajouter une ligne une ligne pour "Autres"
    kiosk_status: string;

    CreatedAt: Date;
    UpdatedAt: Date;
 
}