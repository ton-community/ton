import { Address, Cell, TonClient } from "..";
import { InternalMessage } from "../messages/InternalMessage";
import { Message } from "../messages/Message";
import { WalletV1SigningMessage } from "./messages/WalletV1SigningMessage";
import { WalletV2SigningMessage } from "./messages/WalletV2SigningMessage";
import { WalletV3SigningMessage } from "./messages/WalletV3SigningMessage";
import { Contract } from "./Contract";
import { contractAddress } from "./sources/ContractSource";
import { WalletV1R1Source } from "./sources/WalletV1R1Source";
import { WalletV1R2Source } from "./sources/WalletV1R2Source";
import { WalletV1R3Source } from "./sources/WalletV1R3Source";
import { WalletV2R1Source } from "./sources/WalletV2R1Source";
import { WalletV2R2Source } from "./sources/WalletV2R2Source";
import { WalletV3R1Source } from "./sources/WalletV3R1Source";
import { WalletV3R2Source } from "./sources/WalletV3R2Source";
import tweetnacl from 'tweetnacl';

export type WalletContractSource =
    | WalletV1R1Source
    | WalletV1R2Source
    | WalletV1R3Source
    | WalletV2R1Source
    | WalletV2R2Source
    | WalletV3R1Source
    | WalletV3R2Source
    ;

export class WalletContract implements Contract {

    static async create(client: TonClient, source: WalletContractSource) {
        let address = await contractAddress(source);
        return new WalletContract(client, source, address);
    }

    readonly client: TonClient;
    readonly address: Address;
    readonly source: WalletContractSource;

    constructor(client: TonClient, source: WalletContractSource, address: Address) {
        this.client = client;
        this.address = address;
        this.source = source;
    }

    async getBalance() {
        return await this.client.getBalance(this.address);
    }

    async getSeqNo() {
        if (await this.client.isContractDeployed(this.address)) {
            let res = await this.client.callGetMethod(this.address, 'seqno');
            return parseInt(res.stack[0][1], 16);
        } else {
            return 0;
        }
    }

    async createTransfer(args: { seqno: number, sendMode: number, order: InternalMessage, secretKey: Buffer }) {

        // Prepare message
        let signingMessage: Message;
        switch (this.source.type) {
            case 'default:simple-wallet':
            case 'default:simple-wallet-2':
            case 'default:simple-wallet-3':
                signingMessage = new WalletV1SigningMessage({
                    seqno: args.seqno,
                    sendMode: args.sendMode,
                    order: args.order
                });
                break;
            case 'default:wallet-v2':
            case 'default:wallet-v2-2':
                signingMessage = new WalletV2SigningMessage({
                    seqno: args.seqno,
                    sendMode: args.sendMode,
                    order: args.order
                });
                break;
            case 'default:wallet-v3':
            case 'default:wallet-v3-2':
                signingMessage = new WalletV3SigningMessage({
                    seqno: args.seqno,
                    sendMode: args.sendMode,
                    order: args.order
                });
                break;
            default:
                throw Error('Unknown contract type: ' + (this.source as any).type);
        }

        // Sign message
        const cell = new Cell();
        signingMessage.writeTo(cell);
        let signature = Buffer.from(tweetnacl.sign.detached(new Uint8Array(await cell.hash()), new Uint8Array(args.secretKey)));

        // Body
        const body = new Cell();
        body.bits.writeBuffer(signature);
        signingMessage.writeTo(body);

        return body;
    }
}