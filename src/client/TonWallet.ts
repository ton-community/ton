import { Address } from "..";
import { TonClient } from "./TonClient";
const TonWeb = require('tonweb');

export class TonWallet {
    readonly address: Address;
    #client: TonClient;
    #contract: any;

    constructor(client: TonClient, address: Address, contract: any) {
        this.#client = client;
        this.address = address;
        this.#contract = contract;
    }

    /**
     * Returns balance of wallet
     * @returns number of TON Coins in the wallet
     */
    getBalance() {
        return this.#client.getBalance(this.address.toString());
    }

    /**
     * Resolve sequence number for transactions
     * @returns seqno to use in transactions
     */
    async getSeqNo() {
        return (await this.#contract.methods.seqno().call()) as number;
    }

    /**
     * Deploy Wallet Contract
     */
    async deploy() {
        await this.#contract.methods.deploy().send();
    }

    /**
     * Transfer TON Coins
     */
    transfer = async (args: { to: Address, amount: number, seqno: number, secretKey: Buffer }) => {

        // Create Transfer
        const transfer = this.#contract.methods.transfer({
            secretKey: new Uint8Array(args.secretKey),
            toAddress: args.to.toFriendly(),
            amount: TonWeb.utils.toNano(args.amount),
            seqno: args.seqno,
            sendMode: 3 /* Some magic number */
        });

        await transfer.send();
    }
}