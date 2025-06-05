import Dexie, { Table } from 'dexie';
import { IBrand } from '../../layout/brand/models/brand.model';
import { IPos } from '../../layout/pos-vente/models/pos.model';
import { IPosForm } from '../../layout/posform/models/posform.model';
import { IPosFormItem } from '../../layout/posform/models/posform_item.model';
import { IRoutePlan } from '../../layout/routeplan/models/routeplan.model';
import { IPosEquipment } from '../../layout/pos-vente/models/posequipment.model';
import { UserLogsModel } from '../../layout/user-logs/models/user-logs.model';
import { IRoutePlanItem } from '../../layout/routeplan/models/routeplanItem.model';

export class AppDB extends Dexie {
  brands!: Table<IBrand, number>;
  pos!: Table<IPos, number>;
  posForms!: Table<IPosForm, number>;
  posformItems!: Table<IPosFormItem, number>;
  routePlans!: Table<IRoutePlan, number>;
  routePlanItems!: Table<IRoutePlanItem, number>;
  posEquipments!: Table<IPosEquipment, number>;
  UserLogs!: Table<UserLogsModel, number>;

  constructor() {
    super('ngdexieliveQuery');
    this.version(4).stores({
      brands: '++id, uuid, name, country_uuid, province_uuid, signature, CreatedAt, UpdatedAt',
      pos: '++id, name, shop, postype, gerant, avenue, quartier, reference, telephone, country_uuid, country_name, province_uuid, province_name, area_uuid, area_name, sub_area_uuid, subarea_name, commune_uuid, commune_name, asm_uuid, sup_uuid, dr_uuid, cyclo_uuid, user_uuid, user_fullname, status, signature, CreatedAt, UpdatedAt',
      posForms: '++id, uuid, price, comment, latitude, longitude, pos_uuid, country_name, province_uuid, province_name, area_uuid, area_name, sub_area_uuid, subarea_name, commune_uuid, commune_name, asm_uuid, sup_uuid, dr_uuid, cyclo_uuid, sync, signature, CreatedAt, UpdatedAt',
      posformItems: '++id, uuid, posform_uuid, brand_uuid, brand_name, number_farde, counter, sold, CreatedAt, UpdatedAt',
      routePlans: '++id, uuid, country_uuid, country_name, province_uuid, province_name, area_uuid, area_name, sub_area_uuid, subarea_name, commune_uuid, commune_name, user_uuid, user_fullname, total_pos, signature, CreatedAt, UpdatedAt',
      routePlanItems: '++id, uuid, routplan_uuid, pos_uuid, pos_name, pos_gerant, pos_shop, postype, status, CreatedAt, UpdatedAt',
      posEquipments: '++id, pos_uuid, parasol, parasol_status, stand, stand_status, kiosk, kiosk_status, CreatedAt, UpdatedAt',
      UserLogs: '++id, name, user_uuid, action, description, signature, CreatedAt, UpdatedAt',
    }).upgrade(async (trans) => {
      console.log("Base de donnee ok!");
      // Handle schema upgrades if necessary
      // Example: await trans.table('brands').toColle ction().modify(...);
    });
  }
}

export const db = new AppDB();