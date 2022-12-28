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
        let code = Cell.fromBoc(Buffer.from('B5EE9C72410101010044000084FF0020DDA4F260810200D71820D70B1FED44D0D31FD3FFD15112BAF2A122F901541044F910F2A2F80001D31F3120D74A96D307D402FB00DED1A4C8CB1FCBFFC9ED5441FDF089', 'hex'))[0];
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
            return Cell.fromBoc(state.code!)[0].beginParse().loadUint(32);
        } else {
            return 0;
        }
    }

    async getPublicKey(executor: ContractProvider) {
        let state = await executor.getState();
        if (state.state === 'active') {
            let sc = Cell.fromBoc(state.code!)[0].beginParse();
            sc.skip(32);
            return sc.loadBuffer(32);
        } else {
            return null;
        }
    }

    async send(executor: ContractProvider, message: Cell) {
        await executor.send(new CellMessage(message));
    }

    createTransfer(args: { seqno: number, sendMode: SendMode, secretKey: Buffer, order: InternalMessage }) {
        return createWalletTransferV1({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order });
    }
}