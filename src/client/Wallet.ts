import BN from "bn.js";
import { keyPairFromSecretKey } from "ton-crypto";
import { Address, BinaryMessage, Cell, CellMessage, CommentMessage, contractAddress, ExternalMessage, Message, StateInit, TonClient } from "..";
import { WalletSource } from "../contracts/sources/WalletSource";
import { WalletV1R2Source } from "../contracts/sources/WalletV1R2Source";
import { WalletV1R3Source } from "../contracts/sources/WalletV1R3Source";
import { WalletV2R1Source } from "../contracts/sources/WalletV2R1Source";
import { WalletV2R2Source } from "../contracts/sources/WalletV2R2Source";
import { WalletV3R1Source } from "../contracts/sources/WalletV3R1Source";
import { WalletV3R2Source } from "../contracts/sources/WalletV3R2Source";
import { WalletContract } from "../contracts/WalletContract";
import { CommonMessageInfo } from "../messages/CommonMessageInfo";
import { InternalMessage } from "../messages/InternalMessage";
import { Maybe } from "../types";
import { SendMode } from "./SendMode";

export type WalletContractType =
    | 'org.ton.wallets.simple'
    | 'org.ton.wallets.simple.r2'
    | 'org.ton.wallets.simple.r3'
    | 'org.ton.wallets.v2'
    | 'org.ton.wallets.v2.r2'
    | 'org.ton.wallets.v3'
    | 'org.ton.wallets.v3.r2';

// Wallet Contract Priority
const allTypes: WalletContractType[] = [
    'org.ton.wallets.simple.r2',
    'org.ton.wallets.simple.r3',
    'org.ton.wallets.v2',
    'org.ton.wallets.v2.r2',
    'org.ton.wallets.v3.r2', // We prefer r1 instead of r2
    'org.ton.wallets.v3'
];

export function validateWalletType(src: string): WalletContractType | null {
    if (src === 'org.ton.wallets.simple'
        || src === 'org.ton.wallets.simple.r2'
        || src === 'org.ton.wallets.simple.r3'
        || src === 'org.ton.wallets.v2'
        || src === 'org.ton.wallets.v2.r2'
        || src === 'org.ton.wallets.v3'
        || src === 'org.ton.wallets.v3.r2') {
        return src;
    }

    return null;
}

function createContract(client: TonClient, type: WalletContractType, publicKey: Buffer, workchain: number) {
    if (type === 'org.ton.wallets.simple') {
        throw Error('Unsupported wallet');
    } else if (type === 'org.ton.wallets.simple.r2') {
        return WalletContract.create(client, WalletV1R2Source.create({ publicKey, workchain }));
    } else if (type === 'org.ton.wallets.simple.r3') {
        return WalletContract.create(client, WalletV1R3Source.create({ publicKey, workchain }));
    } else if (type === 'org.ton.wallets.v2') {
        return WalletContract.create(client, WalletV2R1Source.create({ publicKey, workchain }));
    } else if (type === 'org.ton.wallets.v2.r2') {
        return WalletContract.create(client, WalletV2R2Source.create({ publicKey, workchain }));
    } else if (type === 'org.ton.wallets.v3') {
        return WalletContract.create(client, WalletV3R1Source.create({ publicKey, workchain }));
    } else if (type === 'org.ton.wallets.v3.r2') {
        return WalletContract.create(client, WalletV3R2Source.create({ publicKey, workchain }));
    } else {
        throw Error('Unknown wallet type: ' + type);
    }
}

export class Wallet {

    static open(client: TonClient, address: Address) {
        return new Wallet(client, address);
    }

    static openDefault(client: TonClient, workchain: number, secretKey: Buffer): Wallet {
        const publicKey = keyPairFromSecretKey(secretKey).publicKey;
        let c = createContract(client, 'org.ton.wallets.v3', publicKey, workchain);
        let w = new Wallet(client, c.address);
        w.prepare(workchain, publicKey, 'org.ton.wallets.v3');
        return w;
    }

    static openByType(client: TonClient, workchain: number, secretKey: Buffer, type: WalletContractType): Wallet {
        const publicKey = keyPairFromSecretKey(secretKey).publicKey;
        let c = createContract(client, type, publicKey, workchain);
        let w = new Wallet(client, c.address);
        w.prepare(workchain, publicKey, type);
        return w;
    }

    static openFromSource(client: TonClient, source: WalletSource): Wallet {
        let address = contractAddress(source);
        let w = new Wallet(client, address);
        w.prepareFromSource(source);
        return w;
    }

    static async findActiveBySecretKey(client: TonClient, workchain: number, secretKey: Buffer): Promise<{ address: Address, type: WalletContractType, deployed: boolean, balance: BN }[]> {
        const publicKey = keyPairFromSecretKey(secretKey).publicKey;
        let types: { address: Address, type: WalletContractType, deployed: boolean, balance: BN }[] = [];
        for (let type of allTypes) {
            let contra = createContract(client, type, publicKey, workchain);
            let deployed = await client.isContractDeployed(contra.address);
            let balance = await client.getBalance(contra.address);
            if (deployed || balance.gt(new BN(0))) {
                types.push({ address: contra.address, type, balance, deployed });
            }
        }
        return types;
    }

    static async findBestBySecretKey(client: TonClient, workchain: number, secretKey: Buffer): Promise<Wallet> {
        const publicKey = keyPairFromSecretKey(secretKey).publicKey;
        let allActive = await this.findActiveBySecretKey(client, workchain, secretKey);

        // Create default one if no wallet exists
        if (allActive.length === 0) {
            return this.openDefault(client, workchain, secretKey);
        }

        // Try to match with biggest balance
        let maxBalance = allActive[0].balance;
        let bestContract = allActive[0].type;
        for (let i = 1; i < allActive.length; i++) {
            let ac = allActive[i];
            // Contracts are sorted by priority
            if (ac.balance.gte(maxBalance)) {
                maxBalance = ac.balance;
                bestContract = ac.type;
            }
        }
        if (maxBalance.gt(new BN(0))) {
            let c = createContract(client, bestContract, publicKey, workchain);;
            let w = new Wallet(client, c.address);
            w.prepare(workchain, publicKey, bestContract);
            return w;
        }

        // Return last (as most recent)
        let c = createContract(client, allActive[allActive.length - 1].type, publicKey, workchain);
        let w = new Wallet(client, c.address);
        w.prepare(workchain, publicKey, allActive[allActive.length - 1].type);
        return w;
    }

    readonly #client: TonClient;
    readonly address: Address;

    #contract: WalletContract | null = null;
    get prepared() {
        return !!this.#contract;
    }

    private constructor(client: TonClient, address: Address) {
        this.#client = client;
        this.address = address;
    }

    async getSeqNo() {
        if (await this.#client.isContractDeployed(this.address)) {
            let res = await this.#client.callGetMethod(this.address, 'seqno');
            return parseInt(res.stack[0][1], 16);
        } else {
            return 0;
        }
    }

    prepare(workchain: number, publicKey: Buffer, type: WalletContractType = 'org.ton.wallets.v3') {
        let contra = createContract(this.#client, type, publicKey, workchain);
        if (!contra.address.equals(this.address)) {
            throw Error('Contract have different address');
        }
        this.#contract = contra;
    }

    prepareFromSource(source: WalletSource) {
        let contra = WalletContract.create(this.#client, source);
        if (!contra.address.equals(this.address)) {
            throw Error('Contract have different address');
        }
        this.#contract = contra;
    }

    /**
     * Transfers value to specified address
     */
    async transfer(args: {
        seqno: number,
        to: Address,
        value: BN,
        secretKey: Buffer,
        bounce: boolean,
        sendMode?: Maybe<SendMode>,
        timeout?: Maybe<number>,
        payload?: Maybe<string | Buffer | Cell>
    }) {
        const contract = this.#contract;
        if (!contract) {
            throw Error('Please, prepare wallet first');
        }

        // Resolve payload
        let payload: Message | null = null;
        if (args.payload) {
            if (typeof args.payload === 'string') {
                payload = new CommentMessage(args.payload);
            } else if (Buffer.isBuffer(args.payload)) {
                payload = new BinaryMessage(args.payload);
            } else if (args.payload instanceof Cell) {
                payload = new CellMessage(args.payload);
            }
        }

        // Check transfer
        const transfer = await contract.createTransfer({
            secretKey: args.secretKey,
            seqno: args.seqno,
            sendMode: args.sendMode || (SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATLY),
            timeout: args.timeout,
            order: new InternalMessage({
                to: args.to,
                value: args.value,
                bounce: args.bounce,
                body: new CommonMessageInfo({ body: payload })
            })
        });

        // Send
        await this.#client.sendExternalMessage(contract, transfer);
    }

    /**
     * Signing transfer request. Could be done offline.
     * @param args sign
     * @returns 
     */
    transferSign(args: {
        to: Address,
        bounce: boolean,
        seqno: number,
        value: BN,
        secretKey: Buffer,
        payload?: Maybe<string | Buffer | Cell>
        timeout?: Maybe<number>,
        sendMode?: Maybe<SendMode>
    }) {
        const contract = this.#contract;
        if (!contract) {
            throw Error('Please, prepare wallet first');
        }

        // Resolve payload
        let payload: Message | null = null;
        if (args.payload) {
            if (typeof args.payload === 'string') {
                payload = new CommentMessage(args.payload);
            } else if (Buffer.isBuffer(args.payload)) {
                payload = new BinaryMessage(args.payload);
            } else if (args.payload instanceof Cell) {
                payload = new CellMessage(args.payload);
            }
        }

        // Transfer
        const transfer = contract.createTransfer({
            secretKey: args.secretKey,
            seqno: args.seqno,
            sendMode: args.sendMode || (SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATLY),
            timeout: args.timeout,
            order: new InternalMessage({
                to: args.to,
                value: args.value,
                bounce: args.bounce,
                body: new CommonMessageInfo({ body: payload })
            })
        });

        // External message
        const message = new ExternalMessage({
            to: contract.address,
            body: new CommonMessageInfo({
                stateInit: new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }),
                body: new CellMessage(transfer)
            })
        });

        const res = new Cell();
        message.writeTo(res);
        return res;
    }

    /**
     * Commit prepared transfer
     * @param transfer signed transfer for commit
     */
    async transferCommit(transfer: Cell) {
        await this.#client.sendFile(transfer.toBoc({ idx: false }));
    }
}