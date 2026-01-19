import express from 'express';
import pricesController from '../controllers/prices-controller';

const router = express.Router();

router.get('/latest', pricesController.getCurrentPrices);

export default router;
