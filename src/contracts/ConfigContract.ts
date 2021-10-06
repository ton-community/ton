import { Address, Cell, Contract, ContractSource, TonClient, UnknownContractSource } from "..";
import { BitStringReader } from "../boc/BitStringReader";
import { parseDictRefs } from "../boc/dict/parseDict";


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
        let cell = Cell.fromBoc(data!)[0];
        let dict = cell.refs[0];
        let res = parseDictRefs(dict, 32);
        return res;
    }
}