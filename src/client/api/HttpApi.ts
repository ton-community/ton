import fetch from 'isomorphic-unfetch';
import { Address } from '../..';
import * as t from 'io-ts';
import { isRight } from 'fp-ts/lib/Either';
import reporter from 'io-ts-reporters';

const version = require('../../../package.json').version as string;

const addressInformation = t.type({
    balance: t.union([t.number, t.string]),
    state: t.union([t.literal('active'), t.literal('uninitialized'), t.literal('frozen')]),
    data: t.string,
    code: t.string
});

const bocResponse = t.type({
    '@type': t.literal('ok')
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

const getTransactions = t.array(t.type({
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
}));

const blockIdExt = t.type({
    '@type': t.literal('ton.blockIdExt'),
    workchain: t.number,
    shard: t.string,
    seqno: t.number,
    root_hash: t.string,
    file_hash: t.string
})

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

export class HttpApi {
    readonly endpoint: string;
    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    getAddressInformation(address: Address) {
        return this.doCall('getAddressInformation', { address: address.toString() }, addressInformation);
    }

    async getTransactions(address: Address, opts: { limit: number, lt?: string, hash?: string, to_lt?: string }) {

        // Convert hash
        let hash: string | undefined = undefined;
        if (opts.hash) {
            hash = Buffer.from(opts.hash, 'base64').toString('hex');
        }

        // Adjust limit
        let limit = opts.limit;
        if (opts.hash && opts.lt) {
            limit++;
        }

        // Do request
        let res = await this.doCall('getTransactions', { address: address.toString(), ...opts, limit, hash }, getTransactions);
        if (res.length > limit) {
            res = res.slice(0, limit);
        }

        // Adjust result
        if (opts.hash && opts.lt) {
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
        return (await this.doCall('shards', { seqno }, getShards)).shards;
    }

    async getBlockTransactions(workchain: number, seqno: number, shard: string) {
        return await this.doCall('getBlockTransactions', { workchain, seqno, shard }, getBlockTransactions)
    }

    async getTransaction(address: Address, lt: string, hash: string) {
        hash = Buffer.from(hash, 'base64').toString('hex');
        let res = await this.doCall('getTransactions', { address: address.toString(), lt, hash, limit: 1 }, getTransactions);
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

    private async doCall<T>(method: string, body: any, codec: t.Type<T>) {
        let res = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Ton-Client-Version': version
            },
            body: JSON.stringify({
                id: '1',
                jsonrpc: '2.0',
                method: method,
                params: body
            })
        });
        if (!res.ok) {
            throw Error('Received error: ' + await res.text());
        }
        let r = await res.json();
        let decoded = codec.decode(r.result);
        if (isRight(decoded)) {
            return decoded.right;
        } else {
            for (let report of reporter.report(decoded)) {
                console.warn(report);
            }
            throw Error('Mailformed response');
        }
    }
}