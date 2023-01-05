import axios, { AxiosAdapter } from "axios";
import * as t from 'io-ts';
import { Address, beginCell, Cell, comment, Contract, ContractProvider, ContractState, external, loadTransaction, openContract, parseTuple, serializeTuple, StateInit, storeMessage, toNano, Transaction, TupleItem, TupleReader } from "ton-core";
import { Maybe } from "../utils/maybe";
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
     * Load one unparsed account transaction
     * @param seqno block sequence number
     * @param address account address
     * @param lt account last transaction lt
     * @returns one unparsed transaction
     */
    async getTransaction(wc: number, shard: string, seqno: number, address: Address, lt: bigint) {
        const urladdr = address.toString({ urlSafe: true });
        const urlpath = `/block/${wc}/${shard}/${seqno}/${urladdr}/tx/${lt.toString(10)}`;

        const res = await axios.get(
            new URL(urlpath, this.#endpoint).href,
            { adapter: this.#adapter, timeout: this.#timeout }
        );

        if (!transactionCodec.is(res.data))
            throw Error('Mailformed response');

        const txcell = Cell.fromBoc(Buffer.from(res.data.boc, 'base64'))[0];
        return { tx:  loadTransaction(txcell.beginParse()), ...res.data }
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
            tx: Transaction
        }[] = [];
        let cells = Cell.fromBoc(Buffer.from(data.boc, 'base64'));
        for (let i = 0; i < data.blocks.length; i++) {
            tx.push({
                block: data.blocks[i],
                tx: loadTransaction(cells[i].beginParse())
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

    /**
     * Execute run method
     * @param seqno block sequence number
     * @param address account address
     * @param name method name
     * @param args method arguments
     * @returns method result
     */
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

    /**
     * Send external message
     * @param message message boc
     * @returns message status
     */
    async sendMessage(message: Buffer) {
        let res = await axios.post(this.#endpoint + '/send', { boc: message.toString('base64') }, { adapter: this.#adapter, timeout: this.#timeout });
        if (!sendCodec.is(res.data)) {
            throw Error('Mailformed response');
        }
        return { status: res.data.status };
    }

    /**
     * Open smart contract
     * @param contract contract
     * @returns opened contract
     */
    open<T extends Contract>(contract: T) {
        return openContract<T>(contract, (args) => createProvider(this, null, args.address, args.init));
    }

    /**
     * Open smart contract
     * @param block block number
     * @param contract contract
     * @returns opened contract
     */
    openAt<T extends Contract>(block: number, contract: T) {
        return openContract<T>(contract, (args) => createProvider(this, block, args.address, args.init));
    }

    /**
     * Create provider
     * @param address address
     * @param init optional init data
     * @returns provider
     */
    provider(address: Address, init?: { code: Cell, data: Cell } | null) {
        return createProvider(this, null, address, init ? init : null);
    }

    /**
     * Create provider at specified block number
     * @param block block number
     * @param address address
     * @param init optional init data
     * @returns provider
     */
    providerAt(block: number, address: Address, init?: { code: Cell, data: Cell } | null) {
        return createProvider(this, block, address, init ? init : null);
    }
}

function createProvider(client: TonClient4, block: number | null, address: Address, init: { code: Cell, data: Cell } | null): ContractProvider {
    return {
        async getState(): Promise<ContractState> {

            // Resolve block
            let sq = block;
            if (sq === null) {
                let res = await client.getLastBlock();
                sq = res.last.seqno;
            }

            // Load state
            let state = await client.getAccount(sq, address);

            // Convert state
            let last = state.account.last ? { lt: BigInt(state.account.last.lt), hash: Buffer.from(state.account.last.hash, 'base64') } : null;
            let storage: {
                type: 'uninit';
            } | {
                type: 'active';
                code: Maybe<Buffer>;
                data: Maybe<Buffer>;
            } | {
                type: 'frozen';
                stateHash: Buffer;
            };
            if (state.account.state.type === 'active') {
                storage = {
                    type: 'active',
                    code: state.account.state.code ? Buffer.from(state.account.state.code, 'base64') : null,
                    data: state.account.state.data ? Buffer.from(state.account.state.data, 'base64') : null,
                };
            } else if (state.account.state.type === 'uninit') {
                storage = {
                    type: 'uninit',
                };
            } else if (state.account.state.type === 'frozen') {
                storage = {
                    type: 'frozen',
                    stateHash: Buffer.from(state.account.state.stateHash, 'base64'),
                };
            } else {
                throw Error('Unsupported state');
            }

            return {
                balance: BigInt(state.account.balance.coins),
                last: last,
                state: storage
            };
        },
        async get(name, args) {
            let sq = block;
            if (sq === null) {
                let res = await client.getLastBlock();
                sq = res.last.seqno;
            }
            let method = await client.runMethod(sq, address, name, args);
            if (method.exitCode !== 0 && method.exitCode !== 1) {
                throw Error('Exit code: ' + method.exitCode);
            }
            return {
                stack: new TupleReader(method.result),
            };
        },
        async external(message) {

            // Resolve last
            let last = await client.getLastBlock();

            // Resolve init
            let neededInit: { code: Cell | null, data: Cell | null } | null = null;
            if (init && (await client.getAccountLite(last.last.seqno, address)).account.state.type !== 'active') {
                neededInit = init;
            }

            // Send with state init
            const ext = external({
                to: address,
                init: neededInit ? { code: neededInit.code, data: neededInit.data } : null,
                body: message
            });
            let pkg = beginCell()
                .store(storeMessage(ext))
                .endCell()
                .toBoc();
            await client.sendMessage(pkg);
        },
        async internal(via, message) {

            // Resolve last
            let last = await client.getLastBlock();

            // Resolve init
            let neededInit: { code: Cell | null, data: Cell | null } | null = null;
            if (init && (await client.getAccountLite(last.last.seqno, address)).account.state.type !== 'active') {
                neededInit = init;
            }

            // Resolve bounce
            let bounce = true;
            if (message.bounce !== null && message.bounce !== undefined) {
                bounce = message.bounce;
            }

            // Resolve value
            let value: bigint;
            if (typeof message.value === 'string') {
                value = toNano(message.value);
            } else {
                value = message.value;
            }

            // Resolve body
            let body: Cell | null = null;
            if (typeof message.body === 'string') {
                body = comment(message.body);
            } else if (message.body) {
                body = message.body;
            }

            // Send internal message
            await via.send({
                to: address,
                value,
                bounce,
                sendMode: message.sendMode,
                init: neededInit,
                body
            });
        }
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

const transactionCodec = t.type({
    block: t.type({
        workchain: t.number,
        seqno: t.number,
        shard: t.string,
        rootHash: t.string,
    }),
    boc: t.string,
    proof: t.string
})
