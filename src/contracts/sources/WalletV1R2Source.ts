import { beginCell, Cell } from "ton-core";
import { ConfigStore } from "../../utils/ConfigStore";
import { ContractSource } from "./ContractSource";

export class WalletV1R2Source implements ContractSource {

    static create(opts: { publicKey: Buffer, workchain: number }) {
        // Resolve parameters
        let publicKey = opts.publicKey;
        let workchain = opts.workchain;

        // Build initial code and data
        let initialCode = Cell.fromBoc(Buffer.from('B5EE9C724101010100530000A2FF0020DD2082014C97BA9730ED44D0D70B1FE0A4F260810200D71820D70B1FED44D0D31FD3FFD15112BAF2A122F901541044F910F2A2F80001D31F3120D74A96D307D402FB00DED1A4C8CB1FCBFFC9ED54D0E2786F', 'hex'))[0];
        let initialData = beginCell()
            .storeUint(0, 32) // Seqno
            .storeBuffer(publicKey)
            .endCell();

        return new WalletV1R2Source({ publicKey, initialCode, initialData, workchain });
    }

    static restore(backup: string) {
        const store = new ConfigStore(backup);
        return WalletV1R2Source.create({ publicKey: store.getBuffer('pk'), workchain: store.getInt('wc') });
    }

    readonly publicKey: Buffer;
    readonly initialCode: Cell;
    readonly initialData: Cell;
    readonly workchain: number;
    readonly type = 'org.ton.wallets.simple.r2';
    readonly walletVersion = 'v1';

    private constructor(opts: { publicKey: Buffer, initialCode: Cell, initialData: Cell, workchain: number }) {
        this.publicKey = opts.publicKey;
        this.initialCode = opts.initialCode;
        this.initialData = opts.initialData;
        this.workchain = opts.workchain;
        Object.freeze(this);
    }

    backup = () => {
        const store = new ConfigStore();
        store.setInt('wc', this.workchain);
        store.setBuffer('pk', this.publicKey);
        return store.save();
    }

    describe = () => {
        return 'Simple Wallet Contract (R2)';
    }
}