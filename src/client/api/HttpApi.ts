import { Address, Cell } from '../..';
import * as t from 'io-ts';
import { isRight } from 'fp-ts/lib/Either';
import reporter from 'io-ts-reporters';
import { TonCache } from '../TonCache';
import DataLoader from 'dataloader';
import axios, { AxiosAdapter } from 'axios';

const version = require('../../../package.json').version as string;

const blockIdExt = t.type({
    '@type': t.literal('ton.blockIdExt'),
    workchain: t.number,
    shard: t.string,
    seqno: t.number,
    root_hash: t.string,
    file_hash: t.string
});

const addressInformation = t.type({
    balance: t.union([t.number, t.string]),
    state: t.union([t.literal('active'), t.literal('uninitialized'), t.literal('frozen')]),
    data: t.string,
    code: t.string,
    last_transaction_id: t.type({
        '@type': t.literal('internal.transactionId'),
        lt: t.string,
        hash: t.string
    }),
    block_id: blockIdExt,
    sync_utime: t.number
});

const bocResponse = t.type({
    '@type': t.literal('ok')
});

const feeResponse = t.type({
    '@type': t.literal('query.fees'),
    source_fees: t.type({
        '@type': t.literal('fees'),
        in_fwd_fee: t.number,
        storage_fee: t.number,
        gas_fee: t.number,
        fwd_fee: t.number
    })
});

const callGetMethod = t.type({
    gas_used: t.number,
    exit_code: t.number,
    stack: t.array(t.unknown)
});

const messageData = t.union([
    t.type({
        '@type': t.literal('msg.dataRaw'),
        'body': t.string
    }),
    t.type({
        '@type': t.literal('msg.dataText'),
        'text': t.string
    }),
    t.type({
        '@type': t.literal('msg.dataDecryptedText'),
        'text': t.string
    }),
    t.type({
        '@type': t.literal('msg.dataEncryptedText'),
        'text': t.string
    })
]);

const message = t.type({
    source: t.string,
    destination: t.string,
    value: t.string,
    fwd_fee: t.string,
    ihr_fee: t.string,
    created_lt: t.string,
    body_hash: t.string,
    msg_data: messageData
});

const transaction = t.type({
    data: t.string,
    utime: t.number,
    transaction_id: t.type({
        lt: t.string,
        hash: t.string
    }),
    fee: t.string,
    storage_fee: t.string,
    other_fee: t.string,
    in_msg: t.union([t.undefined, message]),
    out_msgs: t.array(message)
});

const getTransactions = t.array(transaction);

const getMasterchain = t.type({
    state_root_hash: t.string,
    last: blockIdExt,
    init: blockIdExt
});

const getShards = t.type({
    shards: t.array(blockIdExt)
});

const blockShortTxt = t.type({
    '@type': t.literal('blocks.shortTxId'),
    mode: t.number,
    account: t.string,
    lt: t.string,
    hash: t.string
})

const getBlockTransactions = t.type({
    id: blockIdExt,
    req_count: t.number,
    incomplete: t.boolean,
    transactions: t.array(blockShortTxt)
});

export type HTTPTransaction = t.TypeOf<typeof getTransactions>[number];
export type HTTPMessage = t.TypeOf<typeof message>;

class TypedCache<K, V> {
    readonly namespace: string;
    readonly cache: TonCache;
    readonly codec: t.Type<V>;
    readonly keyEncoder: (src: K) => string;

    constructor(namespace: string, cache: TonCache, codec: t.Type<V>, keyEncoder: (src: K) => string) {
        this.namespace = namespace;
        this.cache = cache;
        this.codec = codec;
        this.keyEncoder = keyEncoder;
    }

    async get(key: K) {
        let ex = await this.cache.get(this.namespace, this.keyEncoder(key));
        if (ex) {
            let decoded = this.codec.decode(JSON.parse(ex));
            if (isRight(decoded)) {
                return decoded.right;
            }
        }
        return null;
    }

    async set(key: K, value: V | null) {
        if (value !== null) {
            await this.cache.set(this.namespace, this.keyEncoder(key), JSON.stringify(value));
        } else {
            await this.cache.set(this.namespace, this.keyEncoder(key), null);
        }
    }
}

export interface HttpApiParameters {

    /**
     * HTTP request timeout in milliseconds.
     */
    timeout?: number;

    /**
     * API Key
     */
    apiKey?: string;

    /**
     * Adapter for Axios
     */
    adapter?: AxiosAdapter;
}

interface HttpApiResolvedParameters extends HttpApiParameters {
    timeout: number;
}

export class HttpApi {
    readonly endpoint: string;
    readonly cache: TonCache;

    private readonly parameters: HttpApiResolvedParameters;
    private shardCache: TypedCache<number, t.TypeOf<typeof blockIdExt>[]>;
    private shardLoader: DataLoader<number, t.TypeOf<typeof blockIdExt>[]>;
    private shardTransactionsCache: TypedCache<{ workchain: number, shard: string, seqno: number }, t.TypeOf<typeof getBlockTransactions>>;
    private shardTransactionsLoader: DataLoader<{ workchain: number, shard: string, seqno: number }, t.TypeOf<typeof getBlockTransactions>, string>;

    constructor(endpoint: string, cache: TonCache, parameters?: HttpApiParameters) {
        this.endpoint = endpoint;
        this.cache = cache;

        this.parameters = {
            timeout: parameters?.timeout || 30000, // 30 seconds by default
            apiKey: parameters?.apiKey
        }

        // Shard
        this.shardCache = new TypedCache('ton-shard', cache, t.array(blockIdExt), (src) => src + '');
        this.shardLoader = new DataLoader(async (src) => {
            return await Promise.all(src.map(async (v) => {
                const cached = await this.shardCache.get(v);
                if (cached) {
                    return cached;
                }
                let loaded = (await this.doCall('shards', { seqno: v }, getShards)).shards;
                await this.shardCache.set(v, loaded);
                return loaded;
            }));
        });

        // Shard Transactions
        this.shardTransactionsCache = new TypedCache('ton-shard-tx', cache, getBlockTransactions, (src) => src.workchain + ':' + src.shard + ':' + src.seqno);
        this.shardTransactionsLoader = new DataLoader(async (src) => {
            return await Promise.all(src.map(async (v) => {
                const cached = await this.shardTransactionsCache.get(v);
                if (cached) {
                    return cached;
                }
                let loaded = await this.doCall('getBlockTransactions', { workchain: v.workchain, seqno: v.seqno, shard: v.shard }, getBlockTransactions);
                await this.shardTransactionsCache.set(v, loaded);
                return loaded;
            }));
        }, { cacheKeyFn: (src) => src.workchain + ':' + src.shard + ':' + src.seqno });
    }

    getAddressInformation(address: Address) {
        return this.doCall('getAddressInformation', { address: address.toString() }, addressInformation);
    }

    async getTransactions(address: Address, opts: { limit: number, lt?: string, hash?: string, to_lt?: string, inclusive?: boolean }) {
        const inclusive = opts.inclusive;
        delete opts.inclusive;

        // Convert hash
        let hash: string | undefined = undefined;
        if (opts.hash) {
            hash = Buffer.from(opts.hash, 'base64').toString('hex');
        }

        // Adjust limit
        let limit = opts.limit;
        if (opts.hash && opts.lt && inclusive !== true) {
            limit++;
        }

        // Do request
        let res = await this.doCall('getTransactions', { address: address.toString(), ...opts, limit, hash }, getTransactions);
        if (res.length > limit) {
            res = res.slice(0, limit);
        }

        // Adjust result
        if (opts.hash && opts.lt && inclusive !== true) {
            res.shift();
            return res;
        } else {
            return res;
        }
    }

    async getMasterchainInfo() {
        return await this.doCall('getMasterchainInfo', {}, getMasterchain);
    }

    async getShards(seqno: number) {
        return await this.shardLoader.load(seqno);
    }

    async getBlockTransactions(workchain: number, seqno: number, shard: string) {
        return await this.shardTransactionsLoader.load({ workchain, seqno, shard });
    }

    async getTransaction(address: Address, lt: string, hash: string) {
        let convHash = Buffer.from(hash, 'base64').toString('hex');
        let res = await this.doCall('getTransactions', { address: address.toString(), lt, hash: convHash, limit: 1 }, getTransactions);
        let ex = res.find((v) => v.transaction_id.lt === lt && v.transaction_id.hash === hash);
        if (ex) {
            return ex;
        } else {
            return null;
        }
    }

    async callGetMethod(address: Address, method: string, params: any[]) {
        return await this.doCall('runGetMethod', { address: address.toString(), method, stack: params }, callGetMethod);
    }

    async sendBoc(body: Buffer) {
        await this.doCall('sendBoc', { boc: body.toString('base64') }, bocResponse);
    }

    async estimateFee(address: Address, args: {
        body: Cell,
        initCode: Cell | null,
        initData: Cell | null,
        ignoreSignature: boolean
    }) {
        return await this.doCall('estimateFee', {
            address: address.toFriendly(),
            body: (await args.body.toBoc({ idx: false })).toString('base64'),
            'init_data': args.initData ? (await args.initData.toBoc({ idx: false })).toString('base64') : '',
            'init_code': args.initCode ? (await args.initCode.toBoc({ idx: false })).toString('base64') : '',
            ignore_chksig: args.ignoreSignature
        }, feeResponse);
    }

    private async doCall<T>(method: string, body: any, codec: t.Type<T>) {
        let headers: Record<string, any> = {
            'Content-Type': 'application/json',
            'X-Ton-Client-Version': version,
        }
        if (this.parameters.apiKey) {
            headers['X-API-Key'] = this.parameters.apiKey
        }
        let res = await axios.post<{ ok: boolean, result: T }>(this.endpoint, JSON.stringify({
            id: '1',
            jsonrpc: '2.0',
            method: method,
            params: body
        }), {
            headers,
            timeout: this.parameters.timeout,
        })
        if (res.status !== 200 || !res.data.ok) {
            throw Error('Received error: ' + JSON.stringify(res.data));
        }
        let decoded = codec.decode(res.data.result);
        if (isRight(decoded)) {
            return decoded.right;
        } else {
            throw Error('Malformed response: ' + reporter.report(decoded).join(', '));
        }
    }
}
