import BN from 'bn.js';
import { Address } from '../address/Address';
import { Cell } from '../boc/Cell';
import { Slice } from '../boc/Slice';

export function parseConfig(cell: Cell) {
    let data = cell.beginParse();
    return {
        address: new Address(-1, data.readBuffer(32)),
        paramsDict: data.readDict(32, (slice) => slice),
    }
}

type GasPricesSimple = {
    type: 'simple'
    gasPrice: BN
    gasLimit: BN
    gasCredit: BN
    blockGasLimit: BN
    freezeDueLimit: BN
    deleteDueLimit: BN
}
type GasPricesExt = {
    type: 'ext'
    gasPrice: BN
    gasLimit: BN
    specialGasLimit: BN
    gasCredit: BN
    blockGasLimit: BN
    freezeDueLimit: BN
    deleteDueLimit: BN
}
type GasPricesFlatPfx = {
    type: 'flat_pfx'
    flatGasLimit: BN
    flatGasPrice: BN
    other: GasPrices
}
type GasPrices = GasPricesSimple | GasPricesExt | GasPricesFlatPfx

export function parseGasLimitsPrices(data: Slice): GasPrices {
    let magic = data.readUintNumber(8);
    if (magic === 0xdd) {
        return parseGasPrices(data);
    } else if (magic === 0xde) {
        return parseGasPricesExt(data);
    } else if (magic === 0xd1) {
        return parseGasFlatPfx(data);
    } else {
        throw new Error('Invalid magic prefix');
    }
}

function parseGasPrices(data: Slice): GasPricesSimple {
    return {
        type: 'simple',
        gasPrice: data.readUint(64),
        gasLimit: data.readUint(64),
        gasCredit: data.readUint(64),
        blockGasLimit: data.readUint(64),
        freezeDueLimit: data.readUint(64),
        deleteDueLimit: data.readUint(64),
    }
}
function parseGasPricesExt(data: Slice): GasPricesExt {
    return {
        type: 'ext',
        gasPrice: data.readUint(64),
        gasLimit: data.readUint(64),
        specialGasLimit: data.readUint(64),
        gasCredit: data.readUint(64),
        blockGasLimit: data.readUint(64),
        freezeDueLimit: data.readUint(64),
        deleteDueLimit: data.readUint(64),
    }
}
function parseGasFlatPfx(data: Slice): GasPricesFlatPfx {
    return {
        type: 'flat_pfx',
        flatGasLimit: data.readUint(64),
        flatGasPrice: data.readUint(64),
        other: parseGasLimitsPrices(data)
    }
}