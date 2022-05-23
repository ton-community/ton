import BN from "bn.js";
import { Address, Cell, Contract, ContractSource, TonClient, UnknownContractSource } from "..";
import { BitStringReader } from "../boc/BitStringReader";
import { beginCell } from "../boc/Builder";
import { parseDictRefs } from "../boc/dict/parseDict";
import { parseFullConfig } from "./configs/configParsing";


export class ConfigContract implements Contract {
    readonly address: Address = Address.parseRaw('-1:5555555555555555555555555555555555555555555555555555555555555555');
    readonly source: ContractSource = new UnknownContractSource('org.ton.config', -1, 'Config Contract');
    private readonly client: TonClient;

    constructor(client: TonClient) {
        this.client = client;
    }

    async getSeqNo() {
        let res = await this.client.callGetMethod(this.address, 'seqno');
        return parseInt(res.stack[0][1], 16);
    }

    async getPublicKey() {
        let data = (await this.client.getContractState(this.address)).data;
        let cell = Cell.fromBoc(data!)[0];
        let reader = new BitStringReader(cell.bits);
        reader.readUint(32); // Seqno
        return reader.readUint(256); // Public Key
    }

    async getConfigsRaw() {
        let data = (await this.client.getContractState(this.address)).data;
        let slice = Cell.fromBoc(data!)[0].beginParse();
        let dict = slice.readRef();
        let res = parseDictRefs(dict, 32);
        return res;
    }

    async getConfigs() {
        let configs = await this.getConfigsRaw();
        return parseFullConfig(configs);
    }

    async createProposal(args: {
        queryId: BN,
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
                .storeRefMaybe(args.paramValue)
                .storeRefMaybe(args.ifHashEqual)
                .endCell()
            )
            .storeBit(args.critical)
            .endCell();
    }
}