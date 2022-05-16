import BN from 'bn.js';
import { Address } from '../address/Address';
import { Cell } from '../boc/Cell';
import { parseDict } from '../boc/dict/parseDict';
import { Slice } from '../boc/Slice';
import { parseConfig, parseGasLimitsPrices } from './parse';

export class Config {
    #params: Map<string, Slice>;
    #address: Address;

    private constructor(private readonly rootCell: Cell) {
        let parsed = parseConfig(rootCell);
        this.#params = parsed.paramsDict;
        this.#address = parsed.address;
    }

    static fromCell(cell: Cell) {
        return new Config(cell);
    }

    get address() {
        return this.#address;
    }

    getParam(param: number) {
        let found = this.#params.get(param.toString());
        return found ? found.clone() : undefined;
    }

    getGasLimitsAndPrices(isMasterchain: boolean) {
        let gasPrice: BN
        let gasLimit: BN
        let specialGasLimit: BN
        let gasCredit: BN
        let blockGasLimit: BN
        let freezeDueLimit: BN
        let deleteDueLimit: BN
        let flatGasLimit: BN | undefined
        let flatGasPrice: BN | undefined
        let param = isMasterchain ? 20 : 21;
        let slice = this.getParam(param);
        if (!slice) {
            throw new Error(`Config param ${param} not found`);
        }
        let limits = parseGasLimitsPrices(slice);
        if (limits.type === 'flat_pfx') {
            flatGasLimit = limits.flatGasLimit;
            flatGasPrice = limits.flatGasPrice;
            limits = limits.other;
        }
        if (limits.type === 'flat_pfx') {
            throw new Error('Invalid gas limit config');

        } 
        gasPrice = limits.gasPrice;
        gasLimit = limits.gasLimit;
        gasCredit = limits.gasCredit;
        blockGasLimit = limits.blockGasLimit;
        freezeDueLimit = limits.freezeDueLimit;
        deleteDueLimit = limits.deleteDueLimit;
        specialGasLimit = limits.type === 'ext' ? limits.specialGasLimit : limits.gasLimit;
        
        return {
            gasPrice,
            gasLimit,
            specialGasLimit,
            gasCredit,
            blockGasLimit,
            freezeDueLimit,
            deleteDueLimit,
            flatGasLimit,
            flatGasPrice
        }
    }
}