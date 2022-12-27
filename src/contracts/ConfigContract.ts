import { Address, beginCell, Cell } from "ton-core";
import { Contract} from "..";
import { parseDictRefs } from "../boc/dict/parseDict";
import { parseFullConfig } from "./configs/configParsing";
import { ContractExecutor } from "./ContractExecutor";


export class ConfigContract implements Contract {
    readonly address: Address = Address.parseRaw('-1:5555555555555555555555555555555555555555555555555555555555555555');

    async getSeqno(executor: ContractExecutor) {
        let res = await executor.callGetMethod('seqno');
        return res.stack.readNumber();
    }

    async getConfigsRaw(executor: ContractExecutor) {
        let state = (await executor.getState());
        if (state.state.kind !== 'active') {
            throw new Error('Contract is not active');
        }
        let slice = Cell.fromBoc(state.state.state.data)[0].beginParse();
        let dict = slice.loadRef();
        let res = parseDictRefs(dict, 32);
        return res;
    }

    async getConfigs(executor: ContractExecutor) {
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