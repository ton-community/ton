import { Address, TonClient } from "..";
import { InternalMessage } from "../messages/InternalMessage";
import { Contract } from "./Contract";
import { contractAddress } from "./sources/ContractSource";
import { WalletV1R1Source } from "./sources/WalletV1R1Source";
import { WalletV1R2Source } from "./sources/WalletV1R2Source";
import { WalletV1R3Source } from "./sources/WalletV1R3Source";
import { WalletV2R1Source } from "./sources/WalletV2R1Source";
import { WalletV2R2Source } from "./sources/WalletV2R2Source";
import { WalletV3R1Source } from "./sources/WalletV3R1Source";
import { WalletV3R2Source } from "./sources/WalletV3R2Source";
import { createWalletTransferV1, createWalletTransferV2, createWalletTransferV3 } from "./messages/createWalletTransfer";

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

    async getSeqNo() {
        if (await this.client.isContractDeployed(this.address)) {
            let res = await this.client.callGetMethod(this.address, 'seqno');
            return parseInt(res.stack[0][1], 16);
        } else {
            return 0;
        }
    }

    createTransfer(args: { seqno: number, sendMode: number, order: InternalMessage, secretKey: Buffer }) {
        switch (this.source.type) {
            case 'org.ton.wallets.simple':
            case 'org.ton.wallets.simple.r2':
            case 'org.ton.wallets.simple.r3':
                return createWalletTransferV1({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order });
            case 'org.ton.wallets.v2':
            case 'org.ton.wallets.v2.r2':
                return createWalletTransferV2({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order });
            case 'org.ton.wallets.v3':
            case 'org.ton.wallets.v3.r2':
                return createWalletTransferV3({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order, walletId: this.source.walletId });
            default:
                throw Error('Unknown contract type: ' + (this.source as any).type);
        }
    }
}