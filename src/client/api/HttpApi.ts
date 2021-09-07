import fetch from 'isomorphic-unfetch';
import { Address } from '../..';
import { Maybe } from '../../types';
const version = require('../../../package.json').version as string;

export class HttpApi {
    readonly endpoint: string;
    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    getAddressInformation(address: Address) {
        return this.doCall<{}>('getAddressInformation', { address: address.toString() });
    }

    getTransactions(opts: { address: Address, limit?: Maybe<number> }) {
        return this.doCall<{}>('getTransactions', { address: opts.address.toString(), limit: opts.limit });
    }

    private async doCall<T>(method: string, body: any) {
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
        return await res.json() as T;
    }
}