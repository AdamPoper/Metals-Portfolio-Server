import { RowDataPacket } from "mysql2";
import GenericEntity from "./generic-entity";

export const METAL_SNAPSHOT_TABLE_NAME = "metal_snapshot";

export interface MetalSnapshot extends GenericEntity, RowDataPacket {
    id: number;
    snap_date: string;
    type: number;
    price: number;
    metal_timestamp: number;
}

export const MetalSnapshotQueries = {
    QUERY_BY_SINGLE_DATE: `SELECT * FROM ${METAL_SNAPSHOT_TABLE_NAME} WHERE snap_date = ?`,
    QUERY_FOR_LATEST: `SELECT * FROM ${METAL_SNAPSHOT_TABLE_NAME} ORDER BY metal_timestamp DESC LIMIT 2`
};
