import { mnemonicNew, mnemonicToWalletKey } from 'ton-crypto';
import { Address } from "../address/Address";
import { Message } from "../messages/Message";
import { Cell } from "../boc/Cell";
import { fromNano } from "../utils/convert";
import { HttpApi } from "./api/HttpApi";
import { ExternalMessage } from "../messages/ExternalMessage";
import { CommonMessageInfo } from "../messages/CommonMessageInfo";
import { StateInit } from "../messages/StateInit";
import { Contract } from "../contracts/Contract";
import { RawMessage } from "../messages/RawMessage";
import { Wallet } from "./Wallet";
import { ElectorContract } from "../contracts/ElectorContract";
import { Maybe } from '../types';
const TonWeb = require('tonweb');

export type TonClientParameters = {
    endpoint: string
}

export class TonClient {
    readonly parameters: TonClientParameters;

    #api: HttpApi;
    rawClient: any;

    services = {
        elector: new ElectorContract(this)
    };

    constructor(parameters: TonClientParameters) {
        this.parameters = parameters;
        this.rawClient = new TonWeb(new TonWeb.HttpProvider(parameters.endpoint));
        this.#api = new HttpApi(parameters.endpoint);
    }

    /**
     * Get Address Balance
     * @param address address for balance check
     * @returns balance
     */
    async getBalance(address: Address) {
        let balance: string = await (this.rawClient.getBalance(address.toString()) as Promise<string>);
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
        let res = await this.rawClient.provider.call(address.toString(), name, params);
        if (res.exit_code !== 0) {
            console.warn(res);
            throw Error('Unable to execute get method. Got exit_code: ' + res.exit_code);
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
        await this.rawClient.provider.sendBoc(base64Boc);
    }

    /**
     * Send external message to contract
     * @param contract contract to send message
     * @param src message body
     */
    async sendExternalMessage(contract: Contract, src: Cell) {
        if (await this.isContractDeployed(contract.address)) {
            const message = new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    body: new RawMessage(src)
                })
            });
            await this.sendMessage(message);
        } else {
            const message = new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    stateInit: new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }),
                    body: new RawMessage(src)
                })
            });
            await this.sendMessage(message);
        }
    }

    /**
     * Check if contract is deployed
     * @param address addres to check
     * @returns true if contract is in active state
     */
    async isContractDeployed(address: Address) {
        return (await this.getContractState(address)).state === 'active';
    }

    /**
     * Resolves contract state
     * @param address contract address
     */
    async getContractState(address: Address) {
        let info = await this.rawClient.provider.getAddressInfo(address.toString());
        let balance = fromNano(info.balance);
        let state = info.state as 'frozen' | 'active' | 'uninitialized';
        return {
            balance,
            state
        };
    }

    /**
     * Open Wallet from address
     * @param source wallet address
     * @returns wallet with specified address
     */
    async openWalletFromAddress(args: { source: Address }) {
        return Wallet.open(this, args.source);
    }

    /**
     * Open Wallet from secret key. Searches for best wallet contract.
     * @param workchain wallet workchain
     * @param secretKey wallet secret key
     * @returns best matched wallet
     */
    async openWalletFromSecretKey(args: { workchain: number, secretKey: Buffer }) {
        return Wallet.findBestBySecretKey(this, args.workchain, args.secretKey);
    }

    /**
     * Open wallet with default contract
     * @param args workchain and secret key
     * @returns wallet
     */
    async openWalletDefaultFromSecretKey(args: { workchain: number, secretKey: Buffer }) {
        return Wallet.openDefault(this, args.workchain, args.secretKey);
    }

    /**
     * Securely creates new wallet
     * @param password optional password
     */
    async createNewWallet(args: { workchain: number, password?: Maybe<string> }) {
        let mnemonic = await mnemonicNew(24, args.password);
        let key = await mnemonicToWalletKey(mnemonic, args.password);
        let wallet = await Wallet.openDefault(this, args.workchain, key.secretKey);
        return {
            mnemonic,
            key,
            wallet
        };
    }
}