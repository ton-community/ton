import { Address, beginCell, Cell, CellMessage, contractAddress, InternalMessage } from "ton-core";
import { SendMode } from "../client/SendMode";
import { Contract } from "../contracts/Contract";
import { ContractProvider } from "../contracts/ContractProvider";
import { createWalletTransferV1 } from "./signing/createWalletTransfer";

export class WalletContractV1R2 implements Contract {

    static create(args: { workchain: number, publicKey: Buffer }) {
        return new WalletContractV1R2(args.workchain, args.publicKey);
    }

    readonly workchain: number;
    readonly publicKey: Buffer;
    readonly address: Address;
    readonly init: { data: Cell, code: Cell };

    private constructor(workchain: number, publicKey: Buffer) {
        this.workchain = workchain;
        this.publicKey = publicKey;

        // Build initial code and data
        let code = Cell.fromBoc(Buffer.from('B5EE9C724101010100530000A2FF0020DD2082014C97BA9730ED44D0D70B1FE0A4F260810200D71820D70B1FED44D0D31FD3FFD15112BAF2A122F901541044F910F2A2F80001D31F3120D74A96D307D402FB00DED1A4C8CB1FCBFFC9ED54D0E2786F', 'hex'))[0];
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
        await executor.send(new CellMessage(message));
    }

    createTransfer(args: { seqno: number, sendMode: SendMode, secretKey: Buffer, order: InternalMessage }) {
        return createWalletTransferV1({ seqno: args.seqno, sendMode: args.sendMode, secretKey: args.secretKey, order: args.order });
    }
}