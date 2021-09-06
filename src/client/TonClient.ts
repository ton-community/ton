import { TonWallet } from "./TonWallet";
import { mnemonicNew, mnemonicToWalletKey } from 'ton-crypto';
import { Address } from "../address/Address";
import { Message } from "../messages/Message";
import { Cell } from "../boc/Cell";
const TonWeb = require('tonweb');

export type TonClientParameters = {
    endpoint: string
}

export class TonClient {

    readonly parameters: TonClientParameters;

    #client: any;

    constructor(parameters: TonClientParameters) {
        this.parameters = parameters;
        this.#client = new TonWeb(new TonWeb.HttpProvider(parameters.endpoint));
    }

    /**
     * Get Address Balance
     * @param address address for balance check
     * @returns balance
     */
    getBalance(address: string | Address) {
        if (typeof address === 'string') {
            return this.#client.getBalance(address) as Promise<number>;
        } else {
            return this.#client.getBalance(address.toString()) as Promise<number>;
        }
    }

    /**
     * Send message to a network
     * @param src source message
     */
    sendMessage(src: Message) {
        const cell = new Cell();
        src.writeTo(cell);
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
        const address = Address.parseRaw((await walletContract.getAddress()).toString(false) as string);
        return new TonWallet(this, address, walletContract);
    }

    /**
     * Securely creates new wallet
     * @param password optional password
     */
    async createWallet(password?: string | null | undefined) {
        let mnemonic = await mnemonicNew(24, password);
        let key = await mnemonicToWalletKey(mnemonic, password);
        let wallet = await this.openWallet(key.publicKey);
        return {
            mnemonic,
            key,
            wallet
        };
    }
}