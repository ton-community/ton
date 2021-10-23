import { Address, Cell, Contract, ContractSource, TonClient, UnknownContractSource } from "..";
import { BitStringReader } from "../boc/BitStringReader";
import { parseDictRefs } from "../boc/dict/parseDict";
import { configParse12, configParse15, configParse16, configParse17, configParse18, configParse40, configParse8, configParseMasterAddress, configParseMasterAddressRequired } from "./configs/configParsing";


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

    async getConfigs() {
        let configs = await this.getConfigsRaw();
        return {
            globalVersion: configParse8(configs.get('8')),
            configAddress: configParseMasterAddressRequired(configs.get('0')),
            electorAddress: configParseMasterAddressRequired(configs.get('1')),
            minterAddress: configParseMasterAddressRequired(configs.get('2')),
            feeCollectorAddress: configParseMasterAddress(configs.get('3')),
            dnsRootAddress: configParseMasterAddress(configs.get('4')),
            validators: {
                ...configParse15(configs.get('15')),
                ...configParse16(configs.get('16')),
                ...configParse17(configs.get('17'))
            },
            validatorsPunish: configParse40(configs.get('40')),
            storagePrices: configParse18(configs.get('18')),
            workchains: configParse12(configs.get('12'))
            // TODO: mint_new_price:Grams mint_add_price:Grams = ConfigParam 6;
            // TODO: to_mint:ExtraCurrencyCollection = ConfigParam 7
            // TODO: mandatory_params:(Hashmap 32 True) = ConfigParam 9
            // TODO: critical_params:(Hashmap 32 True) = ConfigParam 10
            // TODO: ConfigVotingSetup = ConfigParam 11
            // TODO: ComplaintPricing = ConfigParam 13
            // TODO: BlockCreateFees = ConfigParam 14
        };
    }
}