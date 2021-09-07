import { TonWallet } from "./TonWallet";
import { mnemonicNew, mnemonicToWalletKey } from 'ton-crypto';
import { Address } from "../address/Address";
import { Message } from "../messages/Message";
import { Cell } from "../boc/Cell";
import { fromNano } from "../utils/convert";
// import { BN } from "bn.js";
// import { TonMessage, TonTransaction } from "./TonTransaction";
// import { Maybe } from "../types";
import { HttpApi } from "./api/HttpApi";
const TonWeb = require('tonweb');

export type TonClientParameters = {
    endpoint: string
}

export class TonClient {

    readonly parameters: TonClientParameters;

    #api: HttpApi;
    #client: any;

    constructor(parameters: TonClientParameters) {
        this.parameters = parameters;
        this.#client = new TonWeb(new TonWeb.HttpProvider(parameters.endpoint));
        this.#api = new HttpApi(parameters.endpoint);
    }

    /**
     * Get Address Balance
     * @param address address for balance check
     * @returns balance
     */
    async getBalance(address: Address) {
        let balance: string = await (this.#client.getBalance(address.toString()) as Promise<string>);
        return fromNano(balance);
    }

    // async getTransactions(opts: { address: Address, limit?: Maybe<number>, before?: Maybe<{ lt: string, hash: string }> }): Promise<TonTransaction[]> {
    //     let limit = 100;
    //     if (opts.limit !== null && opts.limit !== undefined) {
    //         limit = opts.limit;
    //     }
    //     let result: TonTransaction[] = [];
    //     let res = await this.#client.provider.send('getTransactions', opts.before ? {
    //         address: opts.address.toString(),
    //         limit,
    //         hash: opts.before.hash,
    //         lt: opts.before.lt
    //     } : {
    //         address: opts.address.toString(),
    //         limit,
    //     });

    //     function parseMessage(src: any): TonMessage {
    //         return {
    //             source: !!src.source ? src.source : null,
    //             destination: !!src.destination ? src.destination : null,
    //             value: new BN(src.value),
    //             ihrFee: new BN(src.ihr_fee),
    //             forwardFee: new BN(src.fwd_fee),
    //             createdLt: src.created_lt,
    //             message: !!src.message ? src.message : null
    //         };
    //     }

    //     for (let r of res) {
    //         let trans: TonTransaction = {
    //             id: {
    //                 lt: r.transaction_id.lt,
    //                 hash: r.transaction_id.hash
    //             },
    //             data: r.data,
    //             fee: new BN(r.fee),
    //             storageFee: new BN(r.storage_fee),
    //             otherFee: new BN(r.other_fee),
    //             inMessage: parseMessage(r.in_msg),
    //             outMessages: r.out_msgs.map(parseMessage)
    //         };
    //         result.push(trans);
    //     }
    //     return result;
    // }

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
    async sendMessage(src: Message) {
        const cell = new Cell();
        src.writeTo(cell);
        let base64Boc = (await cell.toBoc({ idx: false })).toString('base64');
        await this.#client.provider.sendBoc(base64Boc);
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
    async openWallet(source: Buffer | Address) {
        if (Buffer.isBuffer(source)) {
            let walletContract = this.#client.wallet.create({
                publicKey: source,
                wc: 0
            });
            const address = Address.parseRaw((await walletContract.getAddress()).toString(false) as string);
            return new TonWallet(this, address);
        } else {
            return new TonWallet(this, source);
        }
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