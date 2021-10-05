import { Cell, ConfigStore } from "../..";
import { ContractSource } from "./ContractSource";

export class WalletV2R2Source implements ContractSource {

    static create(opts: { publicKey: Buffer, workchain: number }) {
        // Resolve parameters
        let publicKey = opts.publicKey;
        let workchain = opts.workchain;

        // Build initial code and data
        let initialCode = Cell.fromBoc('B5EE9C724101010100630000C2FF0020DD2082014C97BA218201339CBAB19C71B0ED44D0D31FD70BFFE304E0A4F2608308D71820D31FD31F01F823BBF263ED44D0D31FD3FFD15131BAF2A103F901541042F910F2A2F800029320D74A96D307D402FB00E8D1A4C8CB1FCBFFC9ED54044CD7A1')[0];
        let initialData = new Cell();
        initialData.bits.writeUint(0, 32); // SeqNo
        initialData.bits.writeBuffer(publicKey); // Public key

        return new WalletV2R2Source({ publicKey, initialCode, initialData, workchain });
    }

    static restore(backup: string) {
        const store = new ConfigStore(backup);
        return WalletV2R2Source.create({ publicKey: store.getBuffer('pk'), workchain: store.getInt('wc') });
    }

    readonly publicKey: Buffer;
    readonly initialCode: Cell;
    readonly initialData: Cell;
    readonly workchain: number;
    readonly type = 'org.ton.wallets.v2.r2';
    readonly walletVersion = 'v2';

    private constructor(opts: { publicKey: Buffer, initialCode: Cell, initialData: Cell, workchain: number }) {
        this.publicKey = opts.publicKey;
        this.workchain = opts.workchain;
        this.initialCode = opts.initialCode;
        this.initialData = opts.initialData;
        Object.freeze(this);
    }

    backup = () => {
        const store = new ConfigStore();
        store.setInt('wc', this.workchain);
        store.setBuffer('pk', this.publicKey);
        return store.save();
    }

    describe = () => {
        return 'Wallet V2 Contract (R2)';
    }
}