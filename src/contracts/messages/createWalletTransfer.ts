import { sign } from "ton-crypto";
import { Cell, InternalMessage } from "../..";
import { Maybe } from "../../types";
import { WalletV1SigningMessage } from "./WalletV1SigningMessage";
import { WalletV2SigningMessage } from "./WalletV2SigningMessage";
import { WalletV3SigningMessage } from "./WalletV3SigningMessage";
import { WalletV4SigningMessage } from "./WalletV4SigningMessage";

export function createWalletTransferV1(args: { seqno: number, sendMode: number, order: InternalMessage, secretKey: Buffer }) {

    let signingMessage = new WalletV1SigningMessage({
        seqno: args.seqno,
        sendMode: args.sendMode,
        order: args.order
    });

    // Sign message
    const cell = new Cell();
    signingMessage.writeTo(cell);
    let signature = sign(cell.hash(), args.secretKey);

    // Body
    const body = new Cell();
    body.bits.writeBuffer(signature);
    signingMessage.writeTo(body);

    return body;
}

export function createWalletTransferV2(args: { seqno: number, sendMode: number, order: InternalMessage, secretKey: Buffer, timeout?: Maybe<number> }) {

    let signingMessage = new WalletV2SigningMessage({
        seqno: args.seqno,
        sendMode: args.sendMode,
        order: args.order,
        timeout: args.timeout
    });

    // Sign message
    const cell = new Cell();
    signingMessage.writeTo(cell);
    let signature = sign(cell.hash(), args.secretKey);

    // Body
    const body = new Cell();
    body.bits.writeBuffer(signature);
    signingMessage.writeTo(body);

    return body;
}

export function createWalletTransferV3(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    order: InternalMessage,
    secretKey: Buffer,
    timeout?: Maybe<number>
}) {

    let signingMessage = new WalletV3SigningMessage({
        timeout: args.timeout,
        walletId: args.walletId,
        seqno: args.seqno,
        sendMode: args.sendMode,
        order: args.order
    });

    // Sign message
    const cell = new Cell();
    signingMessage.writeTo(cell);
    let signature = sign(cell.hash(), args.secretKey);

    // Body
    const body = new Cell();
    body.bits.writeBuffer(signature);
    signingMessage.writeTo(body);

    return body;
}

export function createWalletTransferV4(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    order: InternalMessage | null,
    secretKey?: Maybe<Buffer>,
    timeout?: Maybe<number>
}) {

    let signingMessage = new WalletV4SigningMessage({
        timeout: args.timeout,
        walletId: args.walletId,
        seqno: args.seqno,
        sendMode: args.sendMode,
        order: args.order
    });

    // Sign message
    const cell = new Cell();
    signingMessage.writeTo(cell);
    let signature: Buffer;
    if (args.secretKey) {
        signature = sign(cell.hash(), args.secretKey);
    } else {
        signature = Buffer.alloc(64);
    }

    // Body
    const body = new Cell();
    body.bits.writeBuffer(signature);
    signingMessage.writeTo(body);

    return body;
}