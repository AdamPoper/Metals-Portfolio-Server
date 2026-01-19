import { MetalSnapshot, MetalSnapshotQueries } from "../entity/metal-snapshot";
import { Persistence } from "../persistence/persistence";

const getCurrentPrices = (req, res) => {
    Persistence.selectEntitiesByNamedQuery<MetalSnapshot>(MetalSnapshotQueries.QUERY_FOR_LATEST)
        .then((prices) => {
            res.status(200).json(prices);
        })
        .catch((error) => {
            console.error('Error fetching current prices:', error);
            res.status(500).json({ error: 'Failed to fetch current prices' });
        });
};

export default {
    getCurrentPrices
};