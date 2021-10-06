import { BN } from "bn.js";
import { Address, Cell } from "../..";
import { BitStringReader } from "../../boc/BitStringReader";
import { parseDict } from "../../boc/dict/parseDict";

export function configParseMasterAddress(src: Cell | null | undefined) {
    if (src) {
        let reader = new BitStringReader(src.bits);
        return new Address(-1, reader.readBuffer(32));
    } else {
        return null;
    }
}

export function configParseMasterAddressRequired(src: Cell | null | undefined) {
    if (!src) {
        throw Error('Invalid config');
    }
    return configParseMasterAddress(src)!;
}

export function configParse15(src: Cell | null | undefined) {
    if (!src) {
        throw Error('Invalid config');
    }
    let reader = new BitStringReader(src.bits);

    let validatorsElectedFor = reader.readUintNumber(32);
    let electorsStartBefore = reader.readUintNumber(32);
    let electorsEndBefore = reader.readUintNumber(32);
    let stakeHeldFor = reader.readUintNumber(32);
    return {
        validatorsElectedFor,
        electorsStartBefore,
        electorsEndBefore,
        stakeHeldFor
    };
}

export function configParse16(src: Cell | null | undefined) {
    if (!src) {
        throw Error('Invalid config');
    }
    let reader = new BitStringReader(src.bits);

    let maxValidators = reader.readUintNumber(16);
    let maxMainValidators = reader.readUintNumber(16);
    let minValidators = reader.readUintNumber(16);
    return {
        maxValidators,
        maxMainValidators,
        minValidators
    };
}

export function configParse17(src: Cell | null | undefined) {
    if (!src) {
        throw Error('Invalid config');
    }
    let reader = new BitStringReader(src.bits);

    let minStake = reader.readCoins();
    let maxStake = reader.readCoins();
    let maxStakeFactor = reader.readUintNumber(32);

    return {
        minStake,
        maxStake,
        maxStakeFactor
    };
}

export function configParse18(src: Cell | null | undefined) {
    if (!src) {
        throw Error('Invalid config');
    }

    return parseDict(src, 32, (cell) => {
        let reader = new BitStringReader(cell.bits);
        let utime_since = reader.readUint(32);
        let bit_price_ps = reader.readUint(64);
        let cell_price_ps = reader.readUint(64);
        let mc_bit_price_ps = reader.readUint(64);
        let mc_cell_price_ps = reader.readUint(64);
        return {
            utime_since,
            bit_price_ps,
            cell_price_ps,
            mc_bit_price_ps,
            mc_cell_price_ps
        };
    });
}

export function configParse8(src: Cell | null | undefined) {
    if (!src) {
        return {
            version: 0,
            capabilities: new BN(0)
        }
    }

    let reader = new BitStringReader(src.bits);
    let version = reader.readUintNumber(32);
    let capabilities = reader.readUint(64);
    return {
        version,
        capabilities
    }
}