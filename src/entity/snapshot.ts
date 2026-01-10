import { RowDataPacket } from "mysql2";
import GenericEntity from "./generic-entity";

export const SNAPSHOT_TABLE_NAME = "portfolio_snapshot";

export default interface Snapshot extends GenericEntity, RowDataPacket {
    id: number;
    snap_date: string;
    value: number;
}

export const SnapshotQueries = {
    ALL: `SELECT * FROM ${SNAPSHOT_TABLE_NAME}`,
    QUERY_BY_DATE_RANGE: `SELECT * FROM ${SNAPSHOT_TABLE_NAME} WHERE snap_date >= ? AND snap_date <= ? ORDER BY snap_date ASC`,
    QUERY_BY_SINGLE_DATE: `SELECT * FROM ${SNAPSHOT_TABLE_NAME} WHERE snap_date = ?`
}