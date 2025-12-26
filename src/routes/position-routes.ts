import express from 'express';
import positionController from '../controllers/position-controller';

const router = express.Router();

router.post('/add', positionController.addPosition);

export default router;
