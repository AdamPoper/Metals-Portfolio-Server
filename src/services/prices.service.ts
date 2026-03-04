import { ApiSpotPrices } from "../models/spot-prices";
import { RealTimeMetalsApiResponse } from "../models/real-time-metals-api-response";
import { Persistence } from "../persistence/persistence";
import { DateTimeHelper } from "../helper/date-time-helper";
import { METAL_SNAPSHOT_TABLE_NAME, MetalSnapshot, MetalSnapshotQueries } from "../entity/metal-snapshot";
import { PositionTypes } from "../entity/position";

const METALS_API_KEY = process.env.METALS_API_KEY;

const METALS_API_BASE_URL = 'https://api.metals.dev/v1';

export class PricesService {

    static async fetchSpotPrices(): Promise<ApiSpotPrices> {
        let data: RealTimeMetalsApiResponse;
        if (process.env.NODE_ENV === 'production') {
            data = await this.callMetalsApi();
        } else {
            data = await this.getMockSpotPrices();
        }
        
        const {gold, silver} = data.metals;
        const spotPrices: ApiSpotPrices = {
            gold,
            silver
        };
        this.persistToDB(spotPrices);
        return spotPrices;
    }

    static async persistToDB(spotPrices: ApiSpotPrices): Promise<void> {
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
            Persistence.transactional(async() => {
                if (goldSnap) {
                    await Persistence.updateEntity(METAL_SNAPSHOT_TABLE_NAME, goldSnap);
                }
                if (silverSnap) {
                    await Persistence.updateEntity(METAL_SNAPSHOT_TABLE_NAME, silverSnap);
                }
            });
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

        Persistence.transactional(async() => {
            await Persistence.persistEntity(METAL_SNAPSHOT_TABLE_NAME, goldSnapshot);
            await Persistence.persistEntity(METAL_SNAPSHOT_TABLE_NAME, silverSnapshot);
        });
    }

    private static async getMockSpotPrices(): Promise<RealTimeMetalsApiResponse> {
        let date = DateTimeHelper.getCurrentEasternDateString();
        let snapshots = await Persistence.selectEntitiesByNamedQuery<MetalSnapshot>(
            MetalSnapshotQueries.QUERY_BY_SINGLE_DATE,
            [date]
        );

        let attempts = -1
        while (snapshots.length === 0) {
            date = DateTimeHelper.getEasternDateStringWithOffset(attempts);
            snapshots = await Persistence.selectEntitiesByNamedQuery<MetalSnapshot>(
                MetalSnapshotQueries.QUERY_BY_SINGLE_DATE,
                [date]
            );
            attempts--;
        }

        const goldSnapshot = snapshots.find(snap => snap.type === PositionTypes.GOLD);
        const silverSnapshot = snapshots.find(snap => snap.type === PositionTypes.SILVER);

        const goldPrice = goldSnapshot?.price ?? 0;
        const silverPrice = silverSnapshot?.price ?? 0;

        const randomizePrice = (basePrice: number): number => {
            const isLower = Math.random() < 0.45;
            const variance = Math.random() * 0.01;
            return isLower ? basePrice * (1 - variance) : basePrice * (1 + variance);
        };

        return {
            metals: {
                gold: randomizePrice(goldPrice),
                silver: randomizePrice(silverPrice)
            }
        } as RealTimeMetalsApiResponse;
    }

    private static async callMetalsApi(): Promise<RealTimeMetalsApiResponse> {
        if (!METALS_API_KEY) {
            throw new Error('Metals API configuration is missing');
        }
        
        const url = `${METALS_API_BASE_URL}/latest?api_key=${METALS_API_KEY}&currency=USD&unit=toz`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch spot prices: ${response.statusText}`);
        }

        return await response.json() as RealTimeMetalsApiResponse;
    }
}