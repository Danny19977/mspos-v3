// ObservationResponse mirrors the Go DTO returned by the /api/observations/* endpoints.
export interface IObservationResponse {
  uuid: string;
  created_at: string;
  updated_at: string;

  /** Texte de l'observation (commentaire non vide) */
  comment: string;

  /** Point de vente */
  pos_uuid: string;
  pos_name: string;

  /** Hiérarchie territoriale */
  country_uuid: string;
  country_name: string;
  province_uuid: string;
  province_name: string;
  area_uuid: string;
  area_name: string;
  sub_area_uuid: string;
  sub_area_name: string;
  commune_uuid: string;
  commune_name: string;

  /** Hiérarchie agentes */
  asm_uuid: string;
  asm: string;
  sup_uuid: string;
  sup: string;
  dr_uuid: string;
  dr: string;
  cyclo_uuid: string;
  cyclo: string;

  /** Auteur de la visite */
  user_uuid: string;
  user_fullname: string;
  user_role: string;
}

export interface IObservationPagination {
  total_records: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

export interface IObservationApiResponse {
  status: string;
  message: string;
  data: IObservationResponse[];
  pagination: IObservationPagination;
}
