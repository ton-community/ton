import axios, { AxiosAdapter } from "axios";
import * as t from 'io-ts';
import { Address, Cell, parseTuple, serializeTuple, TupleItem } from "ton-core";
import { Contract } from "../contracts/Contract";
import { toUrlSafe } from "../utils/toUrlSafe";

export type TonClient4Parameters = {

    /**
     * API endpoint
     */
    endpoint: string;

    /**
     * HTTP request timeout in milliseconds.
     */
    timeout?: number;

    /**
     * HTTP Adapter for axios
     */
    httpAdapter?: AxiosAdapter;
}

export class TonClient4 {

    #endpoint: string;
    #timeout: number;
    #adapter?: AxiosAdapter;

    constructor(args: TonClient4Parameters) {
        this.#endpoint = args.endpoint;
        this.#timeout = args.timeout || 5000;
        this.#adapter = args.httpAdapter;
    }

    /**
     * Get Last Block
     * @returns last block info
     */
    async getLastBlock() {
        let res = await axios.get(this.#endpoint + '/block/latest', { adapter: this.#adapter, timeout: this.#timeout });
        if (!lastBlockCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    /**
     * Get block info
     * @param seqno block sequence number
     * @returns block info
     */
    async getBlock(seqno: number) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno, { adapter: this.#adapter, timeout: this.#timeout });
        if (!blockCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        if (!res.data.exist) {
            throw Error('Block is out of scope');
        }
        return res.data.block;
    }

    /**
     * Get block info by unix timestamp
     * @param ts unix timestamp
     * @returns block info
     */
    async getBlockByUtime(ts: number) {
        let res = await axios.get(this.#endpoint + '/block/utime/' + ts, { adapter: this.#adapter, timeout: this.#timeout });
        if (!blockCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        if (!res.data.exist) {
            throw Error('Block is out of scope');
        }
        return res.data.block;
    }

    /**
     * Get block info by unix timestamp
     * @param seqno block sequence number
     * @param address account address
     * @returns account info
     */
    async getAccount(seqno: number, address: Address) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/' + address.toString({ urlSafe: true }), { adapter: this.#adapter, timeout: this.#timeout });
        if (!accountCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    /**
     * Get account lite info (without code and data)
     * @param seqno block sequence number
     * @param address account address
     * @returns account lite info
     */
    async getAccountLite(seqno: number, address: Address) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/' + address.toString({ urlSafe: true }) + '/lite', { adapter: this.#adapter, timeout: this.#timeout });
        if (!accountLiteCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    /**
     * Check if account was updated since
     * @param seqno block sequence number
     * @param address account address
     * @param lt account last transaction lt
     * @returns account change info
     */
    async isAccountChanged(seqno: number, address: Address, lt: bigint) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/' + address.toString({ urlSafe: true }) + '/changed/' + lt.toString(10), { adapter: this.#adapter, timeout: this.#timeout });
        if (!changedCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    /**
     * Load unparsed account transactions
     * @param address address
     * @param lt last transaction lt
     * @param hash last transaction hash
     * @returns unparsed transactions
     */
    async getAccountTransactions(address: Address, lt: bigint, hash: Buffer) {
        let res = await axios.get(this.#endpoint + '/account/' + address.toString({ urlSafe: true }) + '/tx/' + lt.toString(10) + '/' + toUrlSafe(hash.toString('base64')), { adapter: this.#adapter, timeout: this.#timeout });
        if (!transactionsCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        let data = res.data;
        let tx: {
            block: {
                workchain: number;
                seqno: number;
                shard: string;
                rootHash: string;
                fileHash: string;
            },
            tx: Cell
        }[] = [];
        let cells = Cell.fromBoc(Buffer.from(data.boc, 'base64'));
        for (let i = 0; i < data.blocks.length; i++) {
            tx.push({
                block: data.blocks[i],
                tx: cells[i]
            });
        }
        return tx;
    }

    /**
     * Get network config
     * @param seqno block sequence number
     * @param ids optional config ids
     * @returns network config
     */
    async getConfig(seqno: number, ids?: number[]) {
        let tail = '';
        if (ids && ids.length > 0) {
            tail = '/' + [...ids].sort().join(',');
        }
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/config' + tail, { adapter: this.#adapter, timeout: this.#timeout });
        if (!configCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    async runMethod(seqno: number, address: Address, name: string, args?: TupleItem[]) {
        let tail = args && args.length > 0 ? '/' + toUrlSafe(serializeTuple(args).toBoc({ idx: false, crc32: false }).toString('base64')) : '';
        let url = this.#endpoint + '/block/' + seqno + '/' + address.toString({ urlSafe: true }) + '/run/' + name + tail;
        let res = await axios.get(url, { adapter: this.#adapter, timeout: this.#timeout });
        if (!runMethodCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return {
            exitCode: res.data.exitCode,
            result: res.data.resultRaw ? parseTuple(Cell.fromBoc(Buffer.from(res.data.resultRaw, 'base64'))[0]) : [],
            resultRaw: res.data.resultRaw,
            block: res.data.block,
            shardBlock: res.data.shardBlock,
        };
    }

    async sendMessage(message: Buffer) {
        let res = await axios.post(this.#endpoint + '/send', { boc: message.toString('base64') }, { adapter: this.#adapter, timeout: this.#timeout });
        if (!sendCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return { status: res.data.status };
    }

    open(block: number, contract: Contract) {

    }
}

//
// Codecs
//

const lastBlockCodec = t.type({
    last: t.type({
        seqno: t.number,
        shard: t.string,
        workchain: t.number,
        fileHash: t.string,
        rootHash: t.string
    }),
    init: t.type({
        fileHash: t.string,
        rootHash: t.string
    }),
    stateRootHash: t.string,
    now: t.number
});

const blockCodec = t.union([t.type({
    exist: t.literal(false)
}), t.type({
    exist: t.literal(true),
    block: t.type({
        shards: t.array(t.type({
            workchain: t.number,
            seqno: t.number,
            shard: t.string,
            rootHash: t.string,
            fileHash: t.string,
            transactions: t.array(t.type({
                account: t.string,
                hash: t.string,
                lt: t.string
            }))
        }))
    })
})]);

// {"lastPaid":1653099243,"duePayment":null,"used":{"bits":119,"cells":1,"publicCells":0}}

const storageStatCodec = t.type({
    lastPaid: t.number,
    duePayment: t.union([t.null, t.string]),
    used: t.type({
        bits: t.number,
        cells: t.number,
        publicCells: t.number
    })
});

const accountCodec = t.type({
    account: t.type({
        state: t.union([
            t.type({ type: t.literal('uninit') }),
            t.type({ type: t.literal('active'), code: t.union([t.string, t.null]), data: t.union([t.string, t.null]) }),
            t.type({ type: t.literal('frozen'), stateHash: t.string })
        ]),
        balance: t.type({
            coins: t.string
        }),
        last: t.union([
            t.null,
            t.type({
                lt: t.string,
                hash: t.string
            })
        ]),
        storageStat: t.union([t.null, storageStatCodec])
    }),
    block: t.type({
        workchain: t.number,
        seqno: t.number,
        shard: t.string,
        rootHash: t.string,
        fileHash: t.string
    })
});

const accountLiteCodec = t.type({
    account: t.type({
        state: t.union([
            t.type({ type: t.literal('uninit') }),
            t.type({ type: t.literal('active'), codeHash: t.string, dataHash: t.string }),
            t.type({ type: t.literal('frozen'), stateHash: t.string })
        ]),
        balance: t.type({
            coins: t.string
        }),
        last: t.union([
            t.null,
            t.type({
                lt: t.string,
                hash: t.string
            })
        ]),
        storageStat: t.union([t.null, storageStatCodec])
    })
});

const changedCodec = t.type({
    changed: t.boolean,
    block: t.type({
        workchain: t.number,
        seqno: t.number,
        shard: t.string,
        rootHash: t.string,
        fileHash: t.string
    })
});

const runMethodCodec = t.type({
    exitCode: t.number,
    resultRaw: t.union([t.string, t.null]),
    block: t.type({
        workchain: t.number,
        seqno: t.number,
        shard: t.string,
        rootHash: t.string,
        fileHash: t.string
    }),
    shardBlock: t.type({
        workchain: t.number,
        seqno: t.number,
        shard: t.string,
        rootHash: t.string,
        fileHash: t.string
    })
});

const configCodec = t.type({
    config: t.type({
        cell: t.string,
        address: t.string,
        globalBalance: t.type({
            coins: t.string
        })
    })
});

const sendCodec = t.type({
    status: t.number
});

const transactionsCodec = t.type({
    blocks: t.array(t.type({
        workchain: t.number,
        seqno: t.number,
        shard: t.string,
        rootHash: t.string,
        fileHash: t.string
    })),
    boc: t.string
});