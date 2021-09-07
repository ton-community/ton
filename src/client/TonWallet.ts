import BN from "bn.js";
import { Address } from "..";
import { Cell } from "../boc/Cell";
import { CommonMessageInfo } from "../messages/CommonMessageInfo";
import { EmptyMessage } from "../messages/EmptyMessage";
import { InternalMessage } from "../messages/InternalMessage";
import { WalletV3SigningMessage } from "../messages/wallet/WalletV3SigningMessage";
import { Maybe } from "../types";
import { toNano } from "../utils/convert";
import { TonClient } from "./TonClient";
import tweetnacl from 'tweetnacl';
import { ExternalMessage } from "../messages/ExternalMessage";
import { RawMessage } from "../messages/RawMessage";

type TransferPackage = {
    to: Address,
    value: BN,
    seqno: number,
    bounceable: boolean,
    sendMode: number
};

export class TonWallet {
    readonly address: Address;
    #client: TonClient;

    constructor(client: TonClient, address: Address) {
        this.#client = client;
        this.address = address;
    }

    /**
     * Returns balance of wallet
     * @returns number of TON Coins in the wallet
     */
    getBalance() {
        return this.#client.getBalance(this.address);
    }

    /**
     * Resolve sequence number for transactions
     * @returns seqno to use in transactions
     */
    async getSeqNo() {
        let res = await this.#client.callGetMethod(this.address, 'seqno');
        return parseInt(res.stack[0][1], 16);
    }

    /**
     * Transfer TON Coins
     */
    transfer = async (args: { to: Address, value: number, seqno: number, secretKey: Buffer, bounceable?: Maybe<boolean> }) => {

        // Prepare transaction
        let prepare = await this.prepareTransfer({
            to: args.to,
            value: args.value,
            seqno: args.seqno,
            bounceable: args.bounceable
        });

        // Sign transfer
        let signed = await this.signTransfer(prepare, args.secretKey);

        // Send transfer
        await this.sendTransfer(signed);
    }

    /**
     * Prepares transfer
     * @param args 
     */
    prepareTransfer = async (args: { to: Address, value: number, seqno?: Maybe<number>, bounceable?: Maybe<boolean> }): Promise<TransferPackage> => {

        // Resolve bounceable
        let seqno: number;
        if (args.seqno !== null && args.seqno !== undefined) {
            seqno = args.seqno;
        } else {
            seqno = await this.getSeqNo();
        }

        // Resolve bounceable
        let bounceable: boolean;
        if (args.bounceable !== null && args.bounceable !== undefined) {
            bounceable = args.bounceable;
        } else {
            let state = await this.#client.getContractState(args.to);
            if (state.state === 'uninitialized') {
                bounceable = false;
            } else {
                bounceable = true;
            }
        }

        // Prepared package
        return {
            to: args.to,
            seqno,
            bounceable,
            value: toNano(args.value),
            sendMode: 3
        };
    }

    signTransfer = async (src: TransferPackage, secretKey: Buffer) => {

        // Signinig message
        const signingMessage = new WalletV3SigningMessage({
            seqno: src.seqno,
            sendMode: src.sendMode,
            order: new InternalMessage({
                to: src.to,
                value: src.value,
                bounce: src.bounceable,
                body: new CommonMessageInfo({ body: new EmptyMessage() })
            })
        });

        // Resolve signature
        const cell = new Cell();
        signingMessage.writeTo(cell);
        let signature = Buffer.from(tweetnacl.sign.detached(new Uint8Array(await cell.hash()), new Uint8Array(secretKey)));

        // Resolve body
        const body = new Cell();
        body.bits.writeBuffer(Buffer.from(signature));
        signingMessage.writeTo(body);

        return body;
    }

    sendTransfer = async (signed: Cell) => {
        const message = new ExternalMessage({
            to: this.address,
            body: new CommonMessageInfo({
                body: new RawMessage(signed)
            })
        });
        await this.#client.sendMessage(message);
    }
}