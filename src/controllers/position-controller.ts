import { Persistence } from "../persistence/persistence";
import Position, { POSITION_TABLE_NAME } from "../entity/position";

const addPosition = async (req: any, res: any) => {
    const position: Position = req.body;
    try {
        const [result] = await Persistence.persistEntity<Position>(POSITION_TABLE_NAME, position);
        const newPosition = await Persistence.selectEntityById<Position>(POSITION_TABLE_NAME, (result as any).insertId);
        res.status(200).json(newPosition);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getAllPositions = async (req: any, res: any) => {
    try {
        const positions = await Persistence.selectEntitiesByNamedQuery<Position>(`SELECT * FROM ${POSITION_TABLE_NAME}`);
        res.status(200).json(positions);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

export default {
    addPosition,
    getAllPositions
};