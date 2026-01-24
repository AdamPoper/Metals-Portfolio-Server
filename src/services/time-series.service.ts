import { Persistence } from "../persistence/persistence";
import { PricesService } from "./prices.service";
import Snapshot, { SNAPSHOT_TABLE_NAME, SnapshotQueries } from "../entity/snapshot";
import Position, {PositionQueries, PositionTypes} from "../entity/position";
import { DateTimeHelper } from "../helper/date-time-helper";

export class TimeSeriesService {

    static timeoutHandle: NodeJS.Timeout;

    static isWithinTradingWindow(): boolean {
        const now = new Date();
        const easternTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
        const hour = easternTime.getHours();

        // Sunday (0) at 18:00 or later, OR Monday-Thursday (1-4) any time, OR Friday (5) before 17:00
        return (dayOfWeek === 0 && hour >= 18) || 
               (dayOfWeek >= 1 && dayOfWeek <= 4) || 
               (dayOfWeek === 5 && hour < 17);
    }

    static async startTimeSeriesUpdateJob(): Promise<void> {
        const run = async () => {
            try {
                if (this.isWithinTradingWindow()) {
                    await this.updateTimeSeries();
                }
            } catch (error) {
                console.error('Error updating time series:', error);
            }
        };

        run();
        const interval = 1000 * 60 * 60; // 1 hour
        this.timeoutHandle = setTimeout(run, interval);
    }

    static killTimeSeriesUpdateJob(): void {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
    }

    static async updateTimeSeries(): Promise<void> {
        const {gold, silver} = await PricesService.fetchSpotPrices();
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