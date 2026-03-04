import { Request, Response } from 'express';
import { Persistence } from "../persistence/persistence";
import Position, { POSITION_TABLE_NAME, PositionQueries } from "../entity/position";
import { TimeSeriesService } from '../services/time-series.service';
import { LIQUIDATION_ACTION_TABLE_NAME, LiquidationAction } from '../entity/liquidation-action';

const addPosition = async (req: Request, res: Response) => {
    const position: Position = req.body;
    try {
        const [result] = await Persistence.persistEntity<Position>(POSITION_TABLE_NAME, position);
        const newPosition = await Persistence.selectEntityById<Position>(POSITION_TABLE_NAME, (result as any).insertId);
        TimeSeriesService.updateTimeSeries();
        res.status(200).json(newPosition);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred');  
        }
    }
};

const getAllPositions = async (req: Request, res: Response) => {
    try {
        const positions = await Persistence.selectEntitiesByNamedQuery<Position>(PositionQueries.QUERY_ALL_NON_ZERO_QUANTITY);
        res.status(200).json(positions);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred');
        }
    }
}

const addLiquidationAction = async (req: Request, res: Response) => {
    const liquidationAction: LiquidationAction = req.body;
    const positionId = liquidationAction.position_id;
    const position = await Persistence.selectEntityById<Position>(POSITION_TABLE_NAME, positionId);
    if (!position) {
        res.status(404).send(`Position with id ${positionId} not found`);
        return;
    }

    liquidationAction.gain_loss = liquidationAction.proceeds - position.cost_basis / position.quantity * liquidationAction.quantity_sold;

    const newCostBasis = position.cost_basis / position.quantity * (position.quantity - liquidationAction.quantity_sold);
    position.cost_basis = newCostBasis;
    position.quantity -= liquidationAction.quantity_sold;

    await Persistence.transactional(async() => {
        await Persistence.updateEntity<Position>(
            POSITION_TABLE_NAME,
            position
        );

        await Persistence.persistEntity<LiquidationAction>(
            LIQUIDATION_ACTION_TABLE_NAME,
            liquidationAction
        );
    });

    TimeSeriesService.updateTimeSeries();
    res.status(200).json({message: `Position with id ${positionId} updated successfully`});
}

export default {
    addPosition,
    getAllPositions,
    addLiquidationAction
};