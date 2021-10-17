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
        return await this.doCall('getTransactions', { address: address.toString(), ...opts }, getTransactions);
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