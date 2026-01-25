import { Request, Response } from 'express';

const checkAuthentication = (req: Request, res: Response) => {
    res.status(200).json({ authenticated: true });
}

export default {
    checkAuthentication
}