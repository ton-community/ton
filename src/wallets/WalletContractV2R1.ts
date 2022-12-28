import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, InternalMessage, SendMode } from "ton-core";
import { Maybe } from "../utils/maybe";
import { createWalletTransferV2 } from "./signing/createWalletTransfer";

export class WalletContractV2R1 implements Contract {

    static create(args: { workchain: number, publicKey: Buffer }) {
        return new WalletContractV2R1(args.workchain, args.publicKey);
    }

    readonly workchain: number;
    readonly publicKey: Buffer;
    readonly address: Address;
    readonly init: { data: Cell, code: Cell };

    private constructor(workchain: number, publicKey: Buffer) {
        this.workchain = workchain;
        this.publicKey = publicKey;

        // Build initial code and data
        let code = Cell.fromBoc(Buffer.from('te6cckEBAQEAVwAAqv8AIN0gggFMl7qXMO1E0NcLH+Ck8mCDCNcYINMf0x8B+CO78mPtRNDTH9P/0VExuvKhA/kBVBBC+RDyovgAApMg10qW0wfUAvsA6NGkyMsfy//J7VShNwu2', 'base64'))[0];
        let data = beginCell()
            .storeUint(0, 32) // Seqno
            .storeBuffer(publicKey)
            .endCell();
        this.init = { code, data };
        this.address = contractAddress(workchain, { code, data });
    }

    async getSeqno(executor: ContractProvider) {
        let state = await executor.getState();
        if (state.state.type === 'active') {
            let res = await executor.callGetMethod('seqno', []);
            return res.stack.readNumber();
        } else {
            return 0;
        }
    }

    async getBalance(executor: ContractProvider) {
        let state = await executor.getState();
        return state.balance;
    }

    async send(executor: ContractProvider, message: Cell) {
        await executor.send(message);
    }

    createTransfer(args: { seqno: number, sendMode: SendMode, secretKey: Buffer, order: InternalMessage, timeout?: Maybe<number> }) {
        return createWalletTransferV2({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order, timeout: args.timeout });
    }
}