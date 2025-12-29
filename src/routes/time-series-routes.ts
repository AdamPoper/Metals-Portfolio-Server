import express from 'express';
import timeSeriesController from '../controllers/time-series-controller';

const router = express.Router();

router.get('/all', timeSeriesController.getAllTimeSeriesData);
router.post('/add', timeSeriesController.addSnapshotToTimeSeries);

export default router;