import { Address, beginCell, Cell } from "ton-core";
import { Contract } from "..";
import { parseDictRefs } from "../boc/dict/parseDict";
import { parseFullConfig } from "./configs/configParsing";
import { ContractProvider } from "./ContractProvider";

export class ConfigContract implements Contract {

    static create() {
        return new ConfigContract();
    }

    readonly address: Address = Address.parseRaw('-1:5555555555555555555555555555555555555555555555555555555555555555');

    private constructor() {

    }

    async getSeqno(executor: ContractProvider) {
        let res = await executor.callGetMethod('seqno', []);
        return res.stack.readNumber();
    }

    async getConfigsRaw(executor: ContractProvider) {
        let state = (await executor.getState());
        if (state.state !== 'active') {
            throw new Error('Contract is not active');
        }
        let slice = Cell.fromBoc(state.data!)[0].beginParse();
        let dict = slice.loadRef();
        let res = parseDictRefs(dict, 32);
        return res;
    }

    async getConfigs(executor: ContractProvider) {
        let configs = await this.getConfigsRaw(executor);
        return parseFullConfig(configs);
    }

    async createProposal(args: {
        queryId: bigint,
        expiresAt: number,
        critical: boolean,
        paramId: number,
        paramValue: Cell | null,
        ifHashEqual: Cell | null
    }) {
        return beginCell()
            .storeUint(0x6e565052, 32)
            .storeUint(args.queryId, 64)
            .storeUint(args.expiresAt, 32)
            .storeRef(beginCell()
                .storeUint(0xf3, 8)
                .storeUint(args.paramId, 32)
                .storeMaybeRef(args.paramValue)
                .storeMaybeRef(args.ifHashEqual)
                .endCell()
            )
            .storeBit(args.critical)
            .endCell();
    }
}