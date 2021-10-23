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

export function configParseWorkchainDescriptor(src: Cell, reader: BitStringReader) {
    if (reader.readUint(8).toNumber() !== 0xA6) {
        throw Error('Invalid config');
    }
    let enabledSince = reader.readUint(32).toNumber();
    let actialMinSplit = reader.readUint(8).toNumber();
    let min_split = reader.readUint(8).toNumber();
    let max_split = reader.readUint(8).toNumber();
    let basic = reader.readBit();
    let active = reader.readBit();
    let accept_msgs = reader.readBit();
    let flags = reader.readUint(13).toNumber();
    let zerostateRootHash = reader.readBuffer(32);
    let zerostateFileHash = reader.readBuffer(32);
    let version = reader.readUint(32).toNumber();

    // Only basic format supported
    if (reader.readBit()) {
        throw Error('Invalid config');
    }
    let vmVersion = reader.readUint(32).toNumber();
    let vmMode = reader.readUint(64);

    return {
        enabledSince,
        actialMinSplit,
        min_split,
        max_split,
        basic,
        active,
        accept_msgs,
        flags,
        zerostateRootHash,
        zerostateFileHash,
        version,
        format: {
            vmVersion,
            vmMode
        }
    };
}

function readPublicKey(reader: BitStringReader) {
    // 8e81278a
    if (reader.readUint(32).toNumber() !== 0x8e81278a) {
        throw Error('Invalid config');
    }
    return reader.readBuffer(32);
}

export function parseValidatorDescr(src: Cell, reader: BitStringReader) {
    let header = reader.readUint(8).toNumber();
    if (header === 0x53) {
        return {
            publicKey: readPublicKey(reader),
            weight: reader.readUint(64),
            adnlAddress: null
        };
    } else if (header === 0x73) {
        return {
            publicKey: readPublicKey(reader),
            weight: reader.readUint(64),
            adnlAddress: reader.readBuffer(32)
        };
    } else {
        throw Error('Invalid config');
    }
}

export function parseValidatorSet(src: Cell) {
    let reader = new BitStringReader(src.bits);
    let header = reader.readUint(8).toNumber();
    if (header === 0x11) {
        let timeSince = reader.readUint(32).toNumber();
        let timeUntil = reader.readUint(32).toNumber();
        let total = reader.readUint(16).toNumber();
        let main = reader.readUint(16).toNumber();
        let list = parseDict(src.refs[0], 16, parseValidatorDescr);
        return {
            timeSince,
            timeUntil,
            total,
            main,
            totalWeight: null,
            list
        };
    } else if (header === 0x12) {
        let timeSince = reader.readUint(32).toNumber();
        let timeUntil = reader.readUint(32).toNumber();
        let total = reader.readUint(16).toNumber();
        let main = reader.readUint(16).toNumber();
        let totalWeight = reader.readUint(64);
        let exists = reader.readBit();
        let list = exists ? parseDict(src.refs[0], 16, parseValidatorDescr) : null;
        return {
            timeSince,
            timeUntil,
            total,
            main,
            totalWeight,
            list
        };
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

export function configParse40(src: Cell | null | undefined) {
    if (!src) {
        return null;
    }

    let reader = new BitStringReader(src.bits);
    let header = reader.readUintNumber(8);
    if (header !== 1) {
        throw Error('Invalid config');
    }

    let defaultFlatFine = reader.readCoins();
    let defaultProportionaFine = reader.readCoins();
    let severityFlatMult = reader.readUintNumber(16);
    let severityProportionalMult = reader.readUintNumber(16);
    let unfunishableInterval = reader.readUintNumber(16);
    let longInterval = reader.readUintNumber(16);
    let longFlatMult = reader.readUintNumber(16);
    let longProportionalMult = reader.readUintNumber(16);
    let mediumInterval = reader.readUintNumber(16);
    let mediumFlatMult = reader.readUintNumber(16);
    let mediumProportionalMult = reader.readUintNumber(16);
    return {
        defaultFlatFine,
        defaultProportionaFine,
        severityFlatMult,
        severityProportionalMult,
        unfunishableInterval,
        longInterval,
        longFlatMult,
        longProportionalMult,
        mediumInterval,
        mediumFlatMult,
        mediumProportionalMult
    };
}

export function configParse12(src: Cell | null | undefined) {
    if (!src) {
        throw Error('Invalid config');
    }
    const reader = new BitStringReader(src.bits);
    if (reader.readUint(1).toNumber()) {
        return parseDict(src.refs[0], 32, configParseWorkchainDescriptor);
    } else {
        throw Error('No workchains exist')
    }
}

export function configParseValidatorSet(src: Cell | null | undefined) {
    if (!src) {
        return null;
    }
    return parseValidatorSet(src);
}