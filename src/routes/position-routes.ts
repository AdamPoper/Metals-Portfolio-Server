import express from 'express';
import positionController from '../controllers/position-controller';

const router = express.Router();

router.post('/add', positionController.addPosition);
router.get('/all', positionController.getAllPositions);
router.post('/liquidation-action/add', positionController.addLiquidationAction);

export default router;
