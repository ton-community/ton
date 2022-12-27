import { Message } from "../messages/Message";
import { HttpApi, HTTPMessage, HTTPTransaction } from "./api/HttpApi";
import { ExternalMessage } from "../messages/ExternalMessage";
import { CommonMessageInfo } from "../messages/CommonMessageInfo";
import { StateInit } from "../messages/StateInit";
import { ContractWithSource } from "../contracts/Contract";
import { Maybe } from '../types';
import { TonTransaction, TonMessage } from './TonTransaction';
import { InMemoryCache, TonCache } from './TonCache';
import { AxiosAdapter } from 'axios';
import { Address, beginCell, Cell, TupleItem, TupleReader } from 'ton-core';
import { CellMessage } from "../messages/CellMessage";

function parseStack(src: any[]) {
    let stack: TupleItem[] = [];
    for (let s of src) {
        if (s[0] === 'num') {
            stack.push({ type: 'int', value: BigInt(s[1]) });
        } else {
            throw Error('Unsupported stack item type: ' + s[0])
        }
    }
    return new TupleReader(stack);
}

export type TonClientParameters = {
    endpoint: string;
    cache?: Maybe<TonCache>;

    /**
     * HTTP request timeout in milliseconds.
     */
    timeout?: number;

    /**
     * API Key
     */
    apiKey?: string;

    /**
     * HTTP Adapter for axios
     */
    httpAdapter?: AxiosAdapter;
}

export type TonClientResolvedParameters = {
    endpoint: string;
    cache: TonCache;
}

function convertMessage(t: HTTPMessage): TonMessage {
    return {
        source: t.source !== '' ? Address.parseFriendly(t.source).address : null,
        destination: t.destination !== '' ? Address.parseFriendly(t.destination).address : null,
        forwardFee: BigInt(t.fwd_fee),
        ihrFee: BigInt(t.ihr_fee),
        value: BigInt(t.value),
        createdLt: t.created_lt,
        body: (
            t.msg_data['@type'] === 'msg.dataRaw'
                ? { type: 'data', data: Buffer.from(t.msg_data.body, 'base64') }
                : (t.msg_data['@type'] === 'msg.dataText'
                    ? { type: 'text', text: Buffer.from(t.msg_data.text, 'base64').toString('utf-8') }
                    : null))
    };
}

function convertTransaction(r: HTTPTransaction): TonTransaction {
    return {
        id: { lt: r.transaction_id.lt, hash: r.transaction_id.hash },
        time: r.utime,
        data: r.data,
        storageFee: BigInt(r.storage_fee),
        otherFee: BigInt(r.other_fee),
        fee: BigInt(r.fee),
        inMessage: r.in_msg ? convertMessage(r.in_msg) : null,
        outMessages: r.out_msgs.map(convertMessage)
    }
}

export class TonClient {
    readonly parameters: TonClientResolvedParameters;

    #api: HttpApi;

    constructor(parameters: TonClientParameters) {
        this.parameters = {
            endpoint: parameters.endpoint,
            cache: parameters.cache ? parameters.cache : new InMemoryCache()
        };
        this.#api = new HttpApi(this.parameters.endpoint, this.parameters.cache, {
            timeout: parameters.timeout,
            apiKey: parameters.apiKey,
            adapter: parameters.httpAdapter
        });
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
    async callGetMethod(address: Address, name: string, params: any[] = []): Promise<{ gas_used: number, stack: TupleReader }> {
        let res = await this.#api.callGetMethod(address, name, params);
        if (res.exit_code !== 0) {
            throw Error('Unable to execute get method. Got exit_code: ' + res.exit_code);
        }
        return { gas_used: res.gas_used, stack: parseStack(res.stack) };
    }

    /**
     * Invoke get method that returns error code instead of throwing error
     * @param address contract address
     * @param name name of method
     * @param params optional parameters
     * @returns stack and gas_used field
    */
    async callGetMethodWithError(address: Address, name: string, params: any[] = []): Promise<{ gas_used: number, stack: TupleReader, exit_code: number }> {
        let res = await this.#api.callGetMethod(address, name, params);
        return { gas_used: res.gas_used, stack: parseStack(res.stack), exit_code: res.exit_code };
    }

    /**
     * Get transactions
     * @param address address
     */
    async getTransactions(address: Address, opts: { limit: number, lt?: string, hash?: string, to_lt?: string, inclusive?: boolean }) {
        // Fetch transactions
        let tx = await this.#api.getTransactions(address, opts);
        let res: TonTransaction[] = [];
        for (let r of tx) {
            res.push(convertTransaction(r))
        }
        return res;
    }

    /**
     * Get transaction by it's id
     * @param address address
     * @param lt logical time
     * @param hash transaction hash
     * @returns transaction or null if not exist
     */
    async getTransaction(address: Address, lt: string, hash: string) {
        let res = await this.#api.getTransaction(address, lt, hash);
        if (res) {
            return convertTransaction(res);
        } else {
            return null;
        }
    }

    /**
     * Fetch latest masterchain info
     * @returns masterchain info
     */
    async getMasterchainInfo() {
        let r = await this.#api.getMasterchainInfo();
        return {
            workchain: r.init.workchain,
            shard: r.last.shard,
            initSeqno: r.init.seqno,
            latestSeqno: r.last.seqno
        }
    }

    /**
     * Fetch latest workchain shards
     * @param seqno masterchain seqno
     */
    async getWorkchainShards(seqno: number) {
        let r = await this.#api.getShards(seqno);
        return r.map((m) => ({
            workchain: m.workchain,
            shard: m.shard,
            seqno: m.seqno
        }));
    }

    /**
     * Fetch transactions inf shards
     * @param workchain
     * @param seqno
     * @param shard
     */
    async getShardTransactions(workchain: number, seqno: number, shard: string) {
        let tx = await this.#api.getBlockTransactions(workchain, seqno, shard);
        if (tx.incomplete) {
            throw Error('Unsupported');
        }
        return tx.transactions.map((v) => ({
            account: Address.parseRaw(v.account),
            lt: v.lt,
            hash: v.hash
        }))
    }

    /**
     * Send message to a network
     * @param src source message
     */
    async sendMessage(src: Message) {
        const boc = beginCell()
            .storeWritable(src)
            .endCell()
            .toBoc();
        await this.#api.sendBoc(boc);
    }

    /**
     * Send file to a network
     * @param src source file
     */
    async sendFile(src: Buffer) {
        await this.#api.sendBoc(src);
    }

    /**
     * Estimate fees for external message
     * @param address target address
     * @returns 
     */
    async estimateExternalMessageFee(address: Address, args: {
        body: Cell,
        initCode: Cell | null,
        initData: Cell | null,
        ignoreSignature: boolean
    }) {
        return await this.#api.estimateFee(address, { body: args.body, initCode: args.initCode, initData: args.initData, ignoreSignature: args.ignoreSignature });
    }

    /**
     * Send external message to contract
     * @param contract contract to send message
     * @param src message body
     */
    async sendExternalMessage(contract: ContractWithSource, src: Cell) {
        if (await this.isContractDeployed(contract.address)) {
            const message = new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    body: new CellMessage(src)
                })
            });
            await this.sendMessage(message);
        } else {
            const message = new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    stateInit: new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }),
                    body: new CellMessage(src)
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
        let balance = BigInt(info.balance);
        let state = info.state as 'frozen' | 'active' | 'uninitialized';
        return {
            balance,
            state,
            code: info.code !== '' ? Buffer.from(info.code, 'base64') : null,
            data: info.data !== '' ? Buffer.from(info.data, 'base64') : null,
            lastTransaction: info.last_transaction_id.lt !== '0' ? {
                lt: info.last_transaction_id.lt,
                hash: info.last_transaction_id.hash,
            } : null,
            blockId: {
                workchain: info.block_id.workchain,
                shard: info.block_id.shard,
                seqno: info.block_id.seqno
            },
            timestampt: info.sync_utime
        };
    }
}
