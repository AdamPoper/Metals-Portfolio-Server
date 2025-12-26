import { Persistence } from "../persistence/persistence";
import Position, { POSITION_TABLE_NAME } from "../entity/position";

const addPosition = async (req: any, res: any) => {
    const position: Position = req.body;
    try {
        await Persistence.persistEntity<Position>(POSITION_TABLE_NAME, position);
        res.status(200).send("Position added");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

export default {
    addPosition,
};