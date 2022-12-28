import { beginCell, InternalMessage } from "ton-core";
import { sign } from "ton-crypto";
import { Maybe } from "../../utils/maybe";
import { WalletV1SigningMessage } from "./WalletV1SigningMessage";
import { WalletV2SigningMessage } from "./WalletV2SigningMessage";
import { WalletV3SigningMessage } from "./WalletV3SigningMessage";
import { WalletV4SigningMessage } from "./WalletV4SigningMessage";

export function createWalletTransferV1(args: { seqno: number, sendMode: number, message: Maybe<InternalMessage>, secretKey: Buffer }) {

    // Create message
    let signingMessage = new WalletV1SigningMessage({
        seqno: args.seqno,
        sendMode: args.sendMode,
        message: args.message
    });

    // Sign message
    const cell = beginCell()
        .storeWritable(signingMessage)
        .endCell();
    let signature = sign(cell.hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeWritable(signingMessage)
        .endCell();

    return body;
}

export function createWalletTransferV2(args: { seqno: number, sendMode: number, messages: InternalMessage[], secretKey: Buffer, timeout?: Maybe<number> }) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw new Error("Maximum number of messages in a single transfer is 4");
    }

    // Create message
    let signingMessage = new WalletV2SigningMessage({
        seqno: args.seqno,
        sendMode: args.sendMode,
        messages: args.messages,
        timeout: args.timeout
    });

    // Sign message
    const cell = beginCell()
        .storeWritable(signingMessage)
        .endCell();
    let signature = sign(cell.hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeWritable(signingMessage)
        .endCell();

    return body;
}

export function createWalletTransferV3(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    messages: InternalMessage[],
    secretKey: Buffer,
    timeout?: Maybe<number>
}) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw new Error("Maximum number of messages in a single transfer is 4");
    }

    // Create message to sign
    let signingMessage = new WalletV3SigningMessage({
        timeout: args.timeout,
        walletId: args.walletId,
        seqno: args.seqno,
        sendMode: args.sendMode,
        messages: args.messages
    });

    // Sign message
    const cell = beginCell()
        .storeWritable(signingMessage)
        .endCell();
    let signature = sign(cell.hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeWritable(signingMessage)
        .endCell();

    return body;
}

export function createWalletTransferV4(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    messages: InternalMessage[],
    secretKey: Buffer,
    timeout?: Maybe<number>
}) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw new Error("Maximum number of messages in a single transfer is 4");
    }

    let signingMessage = new WalletV4SigningMessage({
        timeout: args.timeout,
        walletId: args.walletId,
        seqno: args.seqno,
        sendMode: args.sendMode,
        messages: args.messages
    });

    // Sign message
    const cell = beginCell()
        .storeWritable(signingMessage);
    let signature: Buffer = sign(cell.endCell().hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeWritable(signingMessage)
        .endCell();

    return body;
}