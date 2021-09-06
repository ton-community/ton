import { TonWallet } from "./TonWallet";
import { mnemonicNew, mnemonicToWalletKey } from 'ton-crypto';
import { Address } from "../address/Address";
import { Message } from "../messages/Message";
import { Cell } from "../boc/Cell";
import { fromNano } from "../utils/convert";
import { BN } from "bn.js";
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
    async getBalance(address: Address) {
        let balance: string;
        if (typeof address === 'string') {
            balance = await (this.#client.getBalance(address) as Promise<string>);
        } else {
            balance = await (this.#client.getBalance(address.toString()) as Promise<string>);
        }
        return fromNano(balance);
    }

    /**
     * Invoke get method
     * @param address contract address
     * @param name name of method
     * @param params optional parameters
     * @returns stack and gas_used field
     */
    async callGetMethod(address: Address, name: string, params: any[] = []): Promise<{ gas_used: number, stack: any[] }> {
        let res = await this.#client.provider.call(address.toString(), name, params);
        if (res.exit_code !== 0) {
            throw Error('Unable to execute get method')
        }
        return { gas_used: res.gas_used, stack: res.stack };
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
     * Resolves contract state
     * @param address contract address
     */
    async getContractState(address: Address) {
        let info = await this.#client.provider.getAddressInfo(address.toString());
        let balance = fromNano(info.balance);
        let state = info.state as 'frozen' | 'active' | 'uninitialized';
        return {
            balance,
            state
        };
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