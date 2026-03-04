import { RowDataPacket } from "mysql2";
import GenericEntity from "./generic-entity";

export const LIQUIDATION_ACTION_TABLE_NAME = 'liquidation_action';

export interface LiquidationAction extends GenericEntity, RowDataPacket {
    id: number;
    position_id: number;
    quantity_sold: number;
    proceeds: number;
    gain_loss: number;
    sale_date: string;
}