import BN from "bn.js";
import { Address } from "..";

export type TonMessage = {
    source: Address | null;
    destination: Address | null;
    value: BN;
    forwardFee: BN;
    ihrFee: BN;
    createdLt: string;
};

export type TonTransaction = {
    id: {
        lt: string;
        hash: string;
    };
    storageFee: BN;
    otherFee: BN;
    fee: BN;
    data: string;
    inMessage: TonMessage;
    outMessages: TonMessage[];
};