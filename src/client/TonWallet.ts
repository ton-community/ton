import { TonClient } from "./TonClient";

export class TonWallet {
    readonly address: string;
    #client: TonClient;
    #contract: any;

    constructor(client: TonClient, address: string, contract: any) {
        this.#client = client;
        this.address = address;
        this.#contract = contract;
    }

    getBalance() {
        return this.#client.getBalance(this.address);
    }
}