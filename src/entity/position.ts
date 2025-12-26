import { RowDataPacket } from "mysql2";
import GenericEntity from "./generic-entity";

export const POSITION_TABLE_NAME = "portfolio_position";

export default interface Position extends GenericEntity, RowDataPacket {
    id: number;
    type: number;
    quantity: number;
    acquired: string;
    cost_basis: number;
}
