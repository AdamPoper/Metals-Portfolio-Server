import {Request, Response} from 'express';
import Snapshot, { SNAPSHOT_TABLE_NAME, SnapshotQueries } from "../entity/snapshot"
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
        const existingSnapshot = await Persistence.selectEntityByNamedQuery<Snapshot>(SnapshotQueries.QUERY_BY_SINGLE_DATE, [snapshot.snap_date]);
        existingSnapshot.value = snapshot.value;
        if (existingSnapshot) {
            await Persistence.updateEntity<Snapshot>(SNAPSHOT_TABLE_NAME, existingSnapshot);
            res.status(200).send('Snapshot for this date already exists and has been updated');
            return;
        }
    } catch (error) {
        console.error('Error checking for existing snapshot:', error);
        res.status(500).send('Error checking for existing snapshot');
        return;
    }

    try {
        const [result] = await Persistence.persistEntity<Snapshot>(SNAPSHOT_TABLE_NAME, snapshot);
        const newSnapshot = await Persistence.selectEntityById<Snapshot>(SNAPSHOT_TABLE_NAME, (result as any).insertId);
        res.status(200).json(newSnapshot);
    } catch (error) {
        res.status(500).send('Error adding snapshot to time series');
    }
}

const getTimeSeriesDataByDateRange = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            res.status(400).send('start and end query parameters are required');
            return;
        }

        if (isNaN(new Date(String(start)).getTime()) || isNaN(new Date(String(end)).getTime())) {
            res.status(400).send('Invalid date format for start or end');
            return;
        }

        if (start > end) {
            res.status(400).send('start date must be before end date');
            return;
        }

        const timeSeriesData = await Persistence.selectEntitiesByNamedQuery<Snapshot>(SnapshotQueries.QUERY_BY_DATE_RANGE, [start, end]);

        res.status(200).json(timeSeriesData);
    } catch (error) {
        res.status(500).send('Error getting time series data for date range');
    }
}

export default {
    getAllTimeSeriesData,
    addSnapshotToTimeSeries,
    getTimeSeriesDataByDateRange
}