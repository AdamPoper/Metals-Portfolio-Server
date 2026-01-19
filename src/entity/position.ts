import { RowDataPacket } from "mysql2";
import GenericEntity from "./generic-entity";

export const POSITION_TABLE_NAME = "portfolio_position";

export enum PositionTypes {
    GOLD = 0,
    SILVER = 1
}

export default interface Position extends GenericEntity, RowDataPacket {
    id: number;
    type: number;
    quantity: number;
    acquired: string;
    cost_basis: number;
}

export const PositionQueries = {
    QUERY_ALL: `SELECT * FROM ${POSITION_TABLE_NAME}`
}