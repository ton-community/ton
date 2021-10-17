import BN from "bn.js";
import { Address } from "..";

export type TonMessageData = {
    type: 'text',
    text: string
} | {
    type: 'data',
    data: Buffer
}

export type TonMessage = {
    source: Address | null;
    destination: Address | null;
    value: BN;
    forwardFee: BN;
    ihrFee: BN;
    createdLt: string;
    body: TonMessageData | null;
};

export type TonTransaction = {
    id: {
        lt: string;
        hash: string;
    };
    time: number;
    storageFee: BN;
    otherFee: BN;
    fee: BN;
    data: string;
    inMessage: TonMessage | null;
    outMessages: TonMessage[];
};