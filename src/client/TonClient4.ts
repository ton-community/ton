import axios, { AxiosAdapter } from "axios";
import BN from "bn.js";
import * as t from 'io-ts';
import { Address } from "../address/Address";
import { parseStack, serializeStack, StackItem } from "../block/stack";
import { Cell } from "../boc/Cell";
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

    async getLastBlock() {
        let res = await axios.get(this.#endpoint + '/block/latest', { adapter: this.#adapter, timeout: this.#timeout });
        if (!lastBlockCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

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

    async getAccount(seqno: number, address: Address) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/' + address.toFriendly({ urlSafe: true }), { adapter: this.#adapter, timeout: this.#timeout });
        if (!accountCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    async getAccountLite(seqno: number, address: Address) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/' + address.toFriendly({ urlSafe: true }) + '/lite', { adapter: this.#adapter, timeout: this.#timeout });
        if (!accountLiteCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    async isAccountChanged(seqno: number, address: Address, lt: BN) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/' + address.toFriendly({ urlSafe: true }) + '/changed/' + lt.toString(10), { adapter: this.#adapter, timeout: this.#timeout });
        if (!changedCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    async getConfig(seqno: number) {
        let res = await axios.get(this.#endpoint + '/block/' + seqno + '/config', { adapter: this.#adapter, timeout: this.#timeout });
        if (!configCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return res.data;
    }

    async runMethod(seqno: number, address: Address, name: string, args?: StackItem[]) {
        let tail = args && args.length > 0 ? '/' + toUrlSafe(serializeStack(args).toBoc({ idx: false, crc32: false }).toString('base64')) : '';
        let url = this.#endpoint + '/block/' + seqno + '/' + address.toFriendly({ urlSafe: true }) + '/run/' + name + tail;
        let res = await axios.get(url, { adapter: this.#adapter, timeout: this.#timeout });
        if (!runMethodCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return {
            exitCode: res.data.exitCode,
            result: res.data.resultRaw ? parseStack(Cell.fromBoc(Buffer.from(res.data.resultRaw, 'base64'))[0]) : [],
            resultRaw: res.data.resultRaw,
            block: res.data.block,
            shardBlock: res.data.shardBlock,
        };
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

const accountCodec = t.type({
    account: t.type({
        state: t.union([
            t.type({ type: t.literal('uninit') }),
            t.type({ type: t.literal('active'), code: t.string, data: t.string }),
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
        ])
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
        ])
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