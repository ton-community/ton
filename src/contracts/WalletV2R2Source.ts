import { Address, Cell } from "..";
import { ContractSource } from "./ContractSource";
import { calculateAdress } from "./utils/calculateAdress";

export class WalletV2R2Source implements ContractSource {

    static async create(opts: { publicKey: Buffer, workchain: number }) {
        // Resolve parameters
        let publicKey = opts.publicKey;
        let workchain = opts.workchain;

        // Build initial code and data
        let initialCode = Cell.fromBoc('B5EE9C724101010100630000C2FF0020DD2082014C97BA218201339CBAB19C71B0ED44D0D31FD70BFFE304E0A4F2608308D71820D31FD31F01F823BBF263ED44D0D31FD3FFD15131BAF2A103F901541042F910F2A2F800029320D74A96D307D402FB00E8D1A4C8CB1FCBFFC9ED54044CD7A1')[0];
        let initialData = new Cell();
        initialData.bits.writeUint(0, 32); // SeqNo
        initialData.bits.writeBuffer(publicKey); // Public key

        // Calculate address
        let address = await calculateAdress(workchain, initialCode, initialData);

        return new WalletV2R2Source({ publicKey, workchain, initialCode, initialData, address });
    }

    readonly publicKey: Buffer;
    readonly workchain: number;
    readonly initialCode: Cell;
    readonly initialData: Cell;
    readonly address: Address;
    readonly type = 'default:wallet-v2-2';

    constructor(opts: { publicKey: Buffer, workchain: number, initialCode: Cell, initialData: Cell, address: Address }) {
        this.publicKey = opts.publicKey;
        this.workchain = opts.workchain;
        this.initialCode = opts.initialCode;
        this.initialData = opts.initialData;
        this.address = opts.address;
    }
}