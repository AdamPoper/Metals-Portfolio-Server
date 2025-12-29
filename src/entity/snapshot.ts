import { RowDataPacket } from "mysql2";
import GenericEntity from "./generic-entity";

export const SNAPSHOT_TABLE_NAME = "portfolio_snapshot";

export default interface Snapshot extends GenericEntity, RowDataPacket {
    id: number;
    date: string;
    value: number;
}