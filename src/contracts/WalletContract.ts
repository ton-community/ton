import { Address, TonClient } from "..";
import { InternalMessage } from "../messages/InternalMessage";
import { Contract } from "./Contract";
import { createWalletTransferV1, createWalletTransferV2, createWalletTransferV3 } from "./messages/createWalletTransfer";
import { WalletSource } from "./sources/WalletSource";
import { Maybe } from "../types";
import { contractAddress } from "./contractAddress";

export class WalletContract implements Contract {

    static create(client: TonClient, source: WalletSource) {
        let address = contractAddress(source);
        return new WalletContract(client, source, address);
    }

    readonly client: TonClient;
    readonly address: Address;
    readonly source: WalletSource;

    constructor(client: TonClient, source: WalletSource, address: Address) {
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

    createTransfer(args: { seqno: number, sendMode: number, order: InternalMessage, secretKey: Buffer, timeout?: Maybe<number> }) {
        switch (this.source.walletVersion) {
            case 'v1':
                return createWalletTransferV1({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order });
            case 'v2':
                return createWalletTransferV2({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order, timeout: args.timeout });
            case 'v3':
                return createWalletTransferV3({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order, walletId: this.source.walletId, timeout: args.timeout });
            default:
                throw Error('Unknown contract type: ' + (this.source as any).type);
        }
    }
}