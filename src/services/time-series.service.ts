import { Persistence } from "../persistence/persistence";
import { PricesService } from "./prices.service";
import Snapshot, { SNAPSHOT_TABLE_NAME, SnapshotQueries } from "../entity/snapshot";
import Position, {PositionQueries, PositionTypes} from "../entity/position";
import { DateTimeHelper } from "../helper/date-time-helper";

export class TimeSeriesService {

    private constructor() {}

    static timeoutHandle: NodeJS.Timeout;

    static async startTimeSeriesUpdateJob(): Promise<void> {
        DateTimeHelper.initializeMarketHolidays();
        const runTimeSeriesUpdate = async () => {
            try {
                if (DateTimeHelper.isMarketTrading()) {
                    await this.updateTimeSeries();
                }
            } catch (error) {
                console.error('Error updating time series:', error);
            } finally {
                const interval = 1000 * 60 * 25; // 25 minutes
                this.timeoutHandle = setTimeout(runTimeSeriesUpdate, interval);
            }
        };

        runTimeSeriesUpdate();
    }

    static killTimeSeriesUpdateJob(): void {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
    }

    static async updateTimeSeries(): Promise<void> {
        const {gold, silver} = await PricesService.fetchSpotPrices();
        console.log(`Updating time series with Gold: ${gold}, Silver: ${silver}`);
        const positions = await Persistence.selectEntitiesByNamedQuery<Position>(PositionQueries.QUERY_ALL);
        const totalValue = positions.reduce((sum, position) => {
            const price = position.type === PositionTypes.GOLD ? gold : silver;
            return sum + (position.quantity * price);
        }, 0);

        const today = DateTimeHelper.getCurrentEasternDateString();
        const existingSnapshot = await Persistence.selectEntityByNamedQuery<Snapshot>(SnapshotQueries.QUERY_BY_SINGLE_DATE, [today]);
        if (existingSnapshot) {
            existingSnapshot.value = totalValue;
            await Persistence.updateEntity<Snapshot>(SNAPSHOT_TABLE_NAME, existingSnapshot);
        } else {
            const newSnapshot = {
                snap_date: today,
                value: totalValue
            } as Snapshot;
            await Persistence.persistEntity<Snapshot>(SNAPSHOT_TABLE_NAME, newSnapshot);
        }
    }
}