import { TonWallet } from "./TonWallet";

const TonWeb = require('tonweb');

export type TonClientParameters = {
    endpoint: string
}

export class TonClient {

    readonly parameters: TonClientParameters;

    #client: any;

    constructor(parameters: TonClientParameters) {
        this.parameters = parameters;
        this.#client = new TonWeb(parameters.endpoint);
    }

    /**
     * Get Address Balance
     * @param address address for balance check
     * @returns balance
     */
    getBalance(address: string) {
        return this.#client.getBalance(address) as Promise<number>;
    }

    /**
     * Open Wallet
     * @param publicKey wallet public key
     */
    async openWallet(publicKey: Buffer) {
        let walletContract = this.#client.wallet.create({
            publicKey: publicKey,
            wc: 0
        });
        const address = (await walletContract.getAddress()).toString(true, true, true) as string;
        return new TonWallet(this, address, walletContract);
    }
}