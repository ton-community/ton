import { Address, beginCell, Cell, CellMessage, contractAddress, InternalMessage } from "ton-core";
import { SendMode } from "../client/SendMode";
import { Contract } from "../contracts/Contract";
import { ContractProvider } from "../contracts/ContractProvider";
import { createWalletTransferV1 } from "./signing/createWalletTransfer";

export class WalletContractV1R1 implements Contract {

    static create(args: { workchain: number, publicKey: Buffer }) {
        return new WalletContractV1R1(args.workchain, args.publicKey);
    }

    readonly workchain: number;
    readonly publicKey: Buffer;
    readonly address: Address;
    readonly init: { data: Cell, code: Cell };

    private constructor(workchain: number, publicKey: Buffer) {
        this.workchain = workchain;
        this.publicKey = publicKey;

        // Build initial code and data
        let code = Cell.fromBoc(Buffer.from('te6cckEBAQEARAAAhP8AIN2k8mCBAgDXGCDXCx/tRNDTH9P/0VESuvKhIvkBVBBE+RDyovgAAdMfMSDXSpbTB9QC+wDe0aTIyx/L/8ntVEH98Ik=', 'base64'))[0];
        let data = beginCell()
            .storeUint(0, 32) // Seqno
            .storeBuffer(publicKey)
            .endCell();
        this.init = { code, data };
        this.address = contractAddress(workchain, { code, data });
    }

    async getSeqno(executor: ContractProvider) {
        let state = await executor.getState();
        if (state.state === 'active') {
            return Cell.fromBoc(state.data!)[0].beginParse().loadUint(32);
        } else {
            return 0;
        }
    }

    async getPublicKey(executor: ContractProvider) {
        let state = await executor.getState();
        if (state.state === 'active') {
            let sc = Cell.fromBoc(state.data!)[0].beginParse();
            sc.skip(32);
            return sc.loadBuffer(32);
        } else {
            return null;
        }
    }

    async getBalance(executor: ContractProvider) {
        let state = await executor.getState();
        return state.balance;
    }

    async send(executor: ContractProvider, message: Cell) {
        await executor.send(new CellMessage(message));
    }

    createTransfer(args: { seqno: number, sendMode: number, secretKey: Buffer, order: InternalMessage }) {
        return createWalletTransferV1({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order });
    }
}