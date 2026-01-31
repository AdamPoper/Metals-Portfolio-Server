import { RowDataPacket } from "mysql2";
import GenericEntity from "./generic-entity";


export interface LiquidationAction extends GenericEntity, RowDataPacket {
    id: number;
    position_id: number;
    quantity_sold: number;
    proceeds: number;
    gain_loss: number;
    sale_date: string;
}