import express from 'express';
import cors from 'cors';
import positionRoutes from './routes/position-routes';
import timeSeriesRoutes from './routes/time-series-routes';
import pricesRoutes from './routes/prices-routes';
import authRoutes from './routes/auth-routes';
import dotenv from 'dotenv';
import { TimeSeriesService } from './services/time-series.service';
import basicAuth from 'express-basic-auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authMiddleware = basicAuth({
    users: {
        'apoper': process.env.METALS_PORTFOLIO_PASSWORD!
    }, challenge: true
});

app.use(authMiddleware);

app.use('/auth', authRoutes);
app.use('/positions', positionRoutes);
app.use('/time-series', timeSeriesRoutes);
app.use('/prices', pricesRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    TimeSeriesService.startTimeSeriesUpdateJob();
});