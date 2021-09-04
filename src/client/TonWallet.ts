import { TonClient } from "./TonClient";
const TonWeb = require('tonweb');

export class TonWallet {
    readonly address: string;
    #client: TonClient;
    #contract: any;

    constructor(client: TonClient, address: string, contract: any) {
        this.#client = client;
        this.address = address;
        this.#contract = contract;
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
        return await this.#contract.methods.seqno().call() as number;
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
    transfer = async (args: { to: string, amount: number, seqno: number, secretKey: Buffer }) => {

        // Create Transfer
        const transfer = this.#contract.methods.transfer({
            secretKey: args.secretKey,
            toAddress: args.to,
            amount: TonWeb.utils.toNano(args.amount),
            seqno: args.seqno,
            sendMode: 3 /* Some magic number */
        });

        await transfer.send();
    }
}