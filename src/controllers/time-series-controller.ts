import {Request, Response} from 'express';
import Snapshot, { SNAPSHOT_TABLE_NAME } from "../entity/snapshot"
import { Persistence } from "../persistence/persistence"

const getAllTimeSeriesData = async (req: Request, res: Response) => {
    try {
        const timeSeriesData = await Persistence.selectEntitiesByNamedQuery<Snapshot>(`SELECT * FROM ${SNAPSHOT_TABLE_NAME}`);
        res.status(200).json(timeSeriesData);
    } catch (error) {
        res.status(500).send('Error getting time series data');
    }
}

const addSnapshotToTimeSeries = async (req: Request, res: Response) => {
    const snapshot: Snapshot = req.body;
    try {
        const [result] = await Persistence.persistEntity<Snapshot>(SNAPSHOT_TABLE_NAME, snapshot);
        const newSnapshot = await Persistence.selectEntityById<Snapshot>(SNAPSHOT_TABLE_NAME, (result as any).insertId);
        res.status(200).json(newSnapshot);
    } catch (error) {
        res.status(500).send('Error adding snapshot to time series');
    }
}

// TODO need another function to retrieve time series by start and end dates

export default {
    getAllTimeSeriesData,
    addSnapshotToTimeSeries
}