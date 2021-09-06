import { Address } from "..";
import { Maybe } from "../types";
import { toNano } from "../utils/convert";
import { TonClient } from "./TonClient";

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
     * Deploy Wallet Contract
     */
    async deploy() {
        await this.#contract.methods.deploy().send();
    }

    /**
     * Transfer TON Coins
     */
    transfer = async (args: { to: Address, amount: number, seqno: number, secretKey: Buffer, bounceable?: Maybe<boolean> }) => {

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

        // Create Transfer
        const transfer = this.#contract.methods.transfer({
            secretKey: new Uint8Array(args.secretKey),
            toAddress: args.to.toFriendly({ bounceable: bounceable }),
            amount: toNano(args.amount),
            seqno: args.seqno,
            sendMode: 3 /* Some magic number */
        });

        await transfer.send();
    }
}