import { Address, Cell, Contract, ContractSource, TonClient, UnknownContractSource } from "..";
import { BitStringReader } from "../boc/BitStringReader";
import { parseDictRefs } from "../boc/dict/parseDict";
import { configParse12, configParse15, configParse16, configParse17, configParse18, configParse40, configParse8, configParseBridge, configParseMasterAddress, configParseMasterAddressRequired, configParseValidatorSet } from "./configs/configParsing";


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
        return {
            configAddress: configParseMasterAddressRequired(configs.get('0')),
            electorAddress: configParseMasterAddressRequired(configs.get('1')),
            minterAddress: configParseMasterAddressRequired(configs.get('2')),
            feeCollectorAddress: configParseMasterAddress(configs.get('3')),
            dnsRootAddress: configParseMasterAddress(configs.get('4')),
            globalVersion: configParse8(configs.get('8')),
            workchains: configParse12(configs.get('12')),
            validators: {
                ...configParse15(configs.get('15')),
                ...configParse16(configs.get('16')),
                ...configParse17(configs.get('17'))
            },
            storagePrices: configParse18(configs.get('18')),
            validatorSets: {
                prevValidators: configParseValidatorSet(configs.get('32')),
                prevTempValidators: configParseValidatorSet(configs.get('33')),
                currentValidators: configParseValidatorSet(configs.get('34')),
                currentTempValidators: configParseValidatorSet(configs.get('35')),
                nextValidators: configParseValidatorSet(configs.get('36')),
                nextTempValidators: configParseValidatorSet(configs.get('37'))
            },
            validatorsPunish: configParse40(configs.get('40')),
            bridges: {
                ethereum: configParseBridge(configs.get('71')),
                binance: configParseBridge(configs.get('72')),
                polygon: configParseBridge(configs.get('73'))
            }
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