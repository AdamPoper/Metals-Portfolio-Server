import express from 'express';
import authController from '../controllers/auth-controller';

const router = express.Router();

router.get('/check', authController.checkAuthentication);

export default router;