import BN from "bn.js";

export type TonMessage = {
    source: string | null;
    destination: string | null;
    value: BN;
    forwardFee: BN;
    ihrFee: BN;
    createdLt: string;
    message: string | null;
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