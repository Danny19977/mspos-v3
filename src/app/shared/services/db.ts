import Dexie, { Table } from 'dexie';
import { IPosForm } from '../../layout/market/posform/models/posform.model';
import { IPosFormItem } from '../../layout/market/posform/models/posform_item.model';
import { UserLogsModel } from '../../layout/management/user-logs/models/user-logs.model';
import { IBrand } from '../../layout/market/brand/models/brand.model';
import { IPos } from '../../layout/market/pos-vente/models/pos.model';
import { IRoutePlan } from '../../layout/market/routeplan/models/routeplan.model';
import { IRoutePlanItem } from '../../layout/market/routeplan/models/routeplanItem.model';
import { IPosEquipment } from '../../layout/market/pos-vente/models/pos-equipment.model';
import { QueuedOperation } from './queue-operation.interface';

export interface LocalUser {
  id?: number;
  identifier: string;
  passwordHash: string;
  token: string;
  userData: any;
  lastSync: Date;
}

export class AppDB extends Dexie {
  brands!: Table<IBrand, number>;
  pos!: Table<IPos, number>;
  posForms!: Table<IPosForm, number>;
  posformItems!: Table<IPosFormItem, number>;
  routePlans!: Table<IRoutePlan, number>;
  routePlanItems!: Table<IRoutePlanItem, number>;
  posEquipments!: Table<IPosEquipment, number>;
  UserLogs!: Table<UserLogsModel, number>;
  syncQueue!: Table<QueuedOperation, number>;
  authUsers!: Table<LocalUser, number>;

  constructor() {
    super('msposlocaldb');
    this.version(6).stores({
      brands: '++id, uuid, name, country_uuid, province_uuid, signature, CreatedAt, UpdatedAt',
      pos: '++id, name, shop, postype, gerant, avenue, quartier, reference, telephone, country_uuid, country_name, province_uuid, province_name, area_uuid, area_name, sub_area_uuid, subarea_name, commune_uuid, commune_name, asm_uuid, sup_uuid, dr_uuid, cyclo_uuid, user_uuid, user_fullname, status, signature, CreatedAt, UpdatedAt',
      posForms: '++id, uuid, price, comment, latitude, longitude, pos_uuid, country_name, province_uuid, province_name, area_uuid, area_name, sub_area_uuid, subarea_name, commune_uuid, commune_name, asm_uuid, sup_uuid, dr_uuid, cyclo_uuid, sync, signature, CreatedAt, UpdatedAt',
      posformItems: '++id, uuid, posform_uuid, brand_uuid, brand_name, number_farde, counter, sold, CreatedAt, UpdatedAt',
      routePlans: '++id, uuid, country_uuid, country_name, province_uuid, province_name, area_uuid, area_name, sub_area_uuid, subarea_name, commune_uuid, commune_name, user_uuid, user_fullname, total_pos, signature, CreatedAt, UpdatedAt',
      routePlanItems: '++id, uuid, routplan_uuid, pos_uuid, pos_name, pos_gerant, pos_shop, postype, status, CreatedAt, UpdatedAt',
      posEquipments: '++id, pos_uuid, parasol, parasol_status, stand, stand_status, kiosk, kiosk_status, CreatedAt, UpdatedAt',
      UserLogs: '++id, name, user_uuid, action, description, signature, CreatedAt, UpdatedAt',
      syncQueue: '++id, operationId, entityType, operation, status, timestamp, userId, retryCount',
      authUsers: '++id, identifier',
    });
    // v7 : ajout de uuid comme index sur la table pos
    this.version(7).stores({
      pos: '++id, uuid, name, shop, postype, gerant, avenue, quartier, reference, telephone, country_uuid, country_name, province_uuid, province_name, area_uuid, area_name, sub_area_uuid, subarea_name, commune_uuid, commune_name, asm_uuid, sup_uuid, dr_uuid, cyclo_uuid, user_uuid, user_fullname, status, signature, CreatedAt, UpdatedAt',
    });
  }
}

export const db = new AppDB(); 