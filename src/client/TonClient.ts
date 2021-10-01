import { mnemonicNew, mnemonicToWalletKey } from 'ton-crypto';
import { Address } from "../address/Address";
import { Message } from "../messages/Message";
import { Cell } from "../boc/Cell";
import { HttpApi } from "./api/HttpApi";
import { ExternalMessage } from "../messages/ExternalMessage";
import { CommonMessageInfo } from "../messages/CommonMessageInfo";
import { StateInit } from "../messages/StateInit";
import { Contract } from "../contracts/Contract";
import { RawMessage } from "../messages/RawMessage";
import { Wallet } from "./Wallet";
import { ElectorContract } from "../contracts/ElectorContract";
import { Maybe } from '../types';
import { BN } from 'bn.js';
import { WalletContractType } from '..';
import { TonTransaction, TonMessage } from './TonTransaction';

export type TonClientParameters = {
    endpoint: string
}

export class TonClient {
    readonly parameters: TonClientParameters;

    #api: HttpApi;

    services = {
        elector: new ElectorContract(this)
    };

    constructor(parameters: TonClientParameters) {
        this.parameters = parameters;
        this.#api = new HttpApi(parameters.endpoint);
    }

    /**
     * Get Address Balance
     * @param address address for balance check
     * @returns balance
     */
    async getBalance(address: Address) {
        return (await this.getContractState(address)).balance;
    }

    /**
     * Invoke get method
     * @param address contract address
     * @param name name of method
     * @param params optional parameters
     * @returns stack and gas_used field
     */
    async callGetMethod(address: Address, name: string, params: any[] = []): Promise<{ gas_used: number, stack: any[] }> {
        let res = await this.#api.callGetMethod(address, name, params);
        if (res.exit_code !== 0) {
            throw Error('Unable to execute get method. Got exit_code: ' + res.exit_code);
        }
        return { gas_used: res.gas_used, stack: res.stack };
    }

    /**
     * Get transactions
     * @param address address
     */
    async getTransactions(address: Address, opts: { limit: number, lt?: string, hash?: string, to_lt?: string }) {
        // Fetch transactions
        let tx = await this.#api.getTransactions(address, opts);
        let res: TonTransaction[] = [];
        function convertMessage(t: {
            source: string,
            destination: string,
            value: string,
            fwd_fee: string,
            ihr_fee: string,
            created_lt: string,
            body_hash: string
        }): TonMessage {
            return {
                source: t.source !== '' ? Address.parseFriendly(t.source).address : null,
                destination: t.destination !== '' ? Address.parseFriendly(t.destination).address : null,
                forwardFee: new BN(t.fwd_fee),
                ihrFee: new BN(t.ihr_fee),
                value: new BN(t.value),
                createdLt: t.created_lt
            };
        }

        for (let r of tx) {
            res.push({
                id: { lt: r.transaction_id.lt, hash: r.transaction_id.hash },
                time: r.utime,
                data: r.data,
                storageFee: new BN(r.storage_fee),
                otherFee: new BN(r.other_fee),
                fee: new BN(r.fee),
                inMessage: convertMessage(r.in_msg),
                outMessages: r.out_msgs.map(convertMessage)
            })
        }
        return res;
    }

    /**
     * Send message to a network
     * @param src source message
     */
    async sendMessage(src: Message) {
        const cell = new Cell();
        src.writeTo(cell);
        const boc = await cell.toBoc({ idx: false });
        await this.#api.sendBoc(boc);
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
        let info = await this.#api.getAddressInformation(address);
        let balance = new BN(info.balance);
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
    async findWalletFromSecretKey(args: { workchain: number, secretKey: Buffer }) {
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
     * Open wallet with default contract
     * @param args workchain and secret key
     * @returns wallet
     */
    async openWalletFromSecretKey(args: { workchain: number, secretKey: Buffer, type: WalletContractType }) {
        return Wallet.openByType(this, args.workchain, args.secretKey, args.type);
    }

    /**
     * Securely creates new wallet
     * @param password optional password
     */
    async createNewWallet(args: { workchain: number, password?: Maybe<string>, type?: Maybe<WalletContractType> }) {
        let mnemonic = await mnemonicNew(24, args.password);
        let key = await mnemonicToWalletKey(mnemonic, args.password);
        let kind = args.type || 'org.ton.wallets.v3';
        let wallet = await Wallet.openByType(this, args.workchain, key.secretKey, kind);
        return {
            mnemonic,
            key,
            wallet
        };
    }
}