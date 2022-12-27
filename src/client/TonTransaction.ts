import { Address } from "ton-core";

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
    value: bigint;
    forwardFee: bigint;
    ihrFee: bigint;
    createdLt: string;
    body: TonMessageData | null;
};

export type TonTransaction = {
    id: {
        lt: string;
        hash: string;
    };
    time: number;
    storageFee: bigint;
    otherFee: bigint;
    fee: bigint;
    data: string;
    inMessage: TonMessage | null;
    outMessages: TonMessage[];
};