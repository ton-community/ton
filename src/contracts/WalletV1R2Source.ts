import { Address, Cell } from "..";
import { ContractSource } from "./ContractSource";
import { calculateAdress } from "./utils/calculateAdress";

export class WalletV3R2Source implements ContractSource {

    static async create(opts: { publicKey: Buffer, workchain: number }) {
        // Resolve parameters
        let publicKey = opts.publicKey;
        let workchain = opts.workchain;

        // Build initial code and data
        let initialCode = Cell.fromBoc('B5EE9C724101010100530000A2FF0020DD2082014C97BA9730ED44D0D70B1FE0A4F260810200D71820D70B1FED44D0D31FD3FFD15112BAF2A122F901541044F910F2A2F80001D31F3120D74A96D307D402FB00DED1A4C8CB1FCBFFC9ED54D0E2786F')[0];
        let initialData = new Cell();
        initialData.bits.writeUint(0, 32); // SeqNo
        initialData.bits.writeBuffer(publicKey); // Public key

        // Calculate address
        let address = await calculateAdress(workchain, initialCode, initialData);

        return new WalletV3R2Source({ publicKey, workchain, initialCode, initialData, address });
    }

    readonly publicKey: Buffer;
    readonly workchain: number;
    readonly initialCode: Cell;
    readonly initialData: Cell;
    readonly address: Address;
    readonly type = 'default:simple-wallet-2';

    constructor(opts: { publicKey: Buffer, workchain: number, initialCode: Cell, initialData: Cell, address: Address }) {
        this.publicKey = opts.publicKey;
        this.workchain = opts.workchain;
        this.initialCode = opts.initialCode;
        this.initialData = opts.initialData;
        this.address = opts.address;
    }
}