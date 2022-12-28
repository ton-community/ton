import { Address } from "ton-core";

export type TonClientMessageData = {
    type: 'text',
    text: string
} | {
    type: 'data',
    data: Buffer
}

export type TonClientMessage = {
    source: Address | null;
    destination: Address | null;
    value: bigint;
    forwardFee: bigint;
    ihrFee: bigint;
    createdLt: string;
    body: TonClientMessageData | null;
};

export type TonClientTransaction = {
    id: {
        lt: string;
        hash: string;
    };
    time: number;
    storageFee: bigint;
    otherFee: bigint;
    fee: bigint;
    data: string;
    inMessage: TonClientMessage | null;
    outMessages: TonClientMessage[];
};