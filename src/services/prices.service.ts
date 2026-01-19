// import dotenv from "dotenv";
import { ApiSpotPrices } from "../models/spot-prices";
import { RealTimeMetalsApiResponse } from "../models/real-time-metals-api-response";
import { Persistence } from "../persistence/persistence";
import { DateTimeHelper } from "../helper/date-time-helper";
import { METAL_SNAPSHOT_TABLE_NAME, MetalSnapshot, MetalSnapshotQueries } from "../entity/metal-snapshot";
import { PositionTypes } from "../entity/position";

// dotenv.config();

// const METALS_API_KEY = process.env.METALS_API_KEY;
// const METALS_API_BASE_URL = process.env.METALS_API_BASE_URL;

const METALS_API_KEY = 'SBYWY5NUIRQ50QU3GULE372U3GULE';
const METALS_API_BASE_URL = 'https://api.metals.dev/v1';

export class PricesService {

    static async fetchSpotPrices(): Promise<ApiSpotPrices> {
        if (!METALS_API_KEY || !METALS_API_BASE_URL) {
            throw new Error('Metals API configuration is missing');
        }
        
        const url = `${METALS_API_BASE_URL}/latest?api_key=${METALS_API_KEY}&currency=USD&unit=toz`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch spot prices: ${response.statusText}`);
        }

        const data = await response.json();
        const {gold, silver} = (data as RealTimeMetalsApiResponse).metals;
        const spotPrices: ApiSpotPrices = {
            gold,
            silver
        };
        this.persistToDB(spotPrices);
        return spotPrices;
    }

    static async persistToDB(spotPrices: ApiSpotPrices): Promise<[any, any]> {
        const today = DateTimeHelper.getCurrentEasternDateString();
        const currentSnapshots = await Persistence.selectEntitiesByNamedQuery<MetalSnapshot>(MetalSnapshotQueries.QUERY_BY_SINGLE_DATE, [today]);
        const now = Date.now();
        if (currentSnapshots.length !== 0) {
            const goldSnap = currentSnapshots.find(snap => snap.type === PositionTypes.GOLD);
            if (goldSnap) {
                goldSnap.price = spotPrices.gold;
                goldSnap.metal_timestamp = now;
            }
            const silverSnap = currentSnapshots.find(snap => snap.type === PositionTypes.SILVER);
            if (silverSnap) {
                silverSnap.price = spotPrices.silver;
                silverSnap.metal_timestamp = now;
            }
            return Promise.all([
                Persistence.updateEntity(METAL_SNAPSHOT_TABLE_NAME, goldSnap),
                Persistence.updateEntity(METAL_SNAPSHOT_TABLE_NAME, silverSnap)
            ]);
        }

        const {gold, silver} = spotPrices;
        const goldSnapshot = {
            snap_date: today,
            type: PositionTypes.GOLD,
            price: gold,
            metal_timestamp: now
        } as MetalSnapshot;
        const silverSnapshot = {
            snap_date: today,
            type: PositionTypes.SILVER,
            price: silver,
            metal_timestamp: now
        } as MetalSnapshot;

        return Promise.all([
            Persistence.persistEntity(METAL_SNAPSHOT_TABLE_NAME, goldSnapshot),
            Persistence.persistEntity(METAL_SNAPSHOT_TABLE_NAME, silverSnapshot)
        ]);
    }
}