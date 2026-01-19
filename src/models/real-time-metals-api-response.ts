import { Metals } from "./metals";

export interface RealTimeMetalsApiResponse {
    status: string;
    currency: string;
    unit: string;
    metals: Metals,
    currencies: Record<string, number>;
    timestamps: {
        metal: string;
        currency: string;
    };
}