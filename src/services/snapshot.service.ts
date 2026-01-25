import { Persistence } from "../persistence/persistence";
import Snapshot, { SNAPSHOT_TABLE_NAME, SnapshotQueries } from "../entity/snapshot";
import * as fs from 'fs';
import * as path from 'path';

export class SnapshotService {

    static async markWeekendSnapshotsForDeletion(): Promise<void> {
        try {
            const allSnapshots = await Persistence.selectEntitiesByNamedQuery<Snapshot>(SnapshotQueries.ALL);
            
            const weekendSnapshots = allSnapshots.filter(snapshot => {
                const date = new Date(snapshot.snap_date);
                const easternTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                const dayOfWeek = easternTime.getDay(); // 5 = Saturday, 6 = Sunday
                return dayOfWeek === 5 || dayOfWeek === 6;
            });

            const filePath = path.join(process.cwd(), 'mark-for-delete.json');
            fs.writeFileSync(filePath, JSON.stringify(weekendSnapshots, null, 2));
            console.log(`Found ${weekendSnapshots.length} weekend snapshots. Written to mark-for-delete.json`);
        } catch (error) {
            console.error('Error marking weekend snapshots for deletion:', error);
            throw error;
        }
    }

    static async deleteMarkedSnapshots(): Promise<void> {
        try {
            const filePath = path.join(process.cwd(), 'mark-for-delete.json');
            
            if (!fs.existsSync(filePath)) {
                console.log('mark-for-delete.json file not found');
                return;
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const snapshotsToDelete: Snapshot[] = JSON.parse(fileContent);

            let deletedCount = 0;
            for (const snapshot of snapshotsToDelete) {
                await Persistence.deleteEntity<Snapshot>(SNAPSHOT_TABLE_NAME, snapshot.id);
                deletedCount++;
            }

            fs.unlinkSync(filePath);
            console.log(`Deleted ${deletedCount} snapshots. Removed mark-for-delete.json`);
        } catch (error) {
            console.error('Error deleting marked snapshots:', error);
            throw error;
        }
    }
}
