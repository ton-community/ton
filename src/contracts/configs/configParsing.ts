import BN from "bn.js";
import { Address, Slice } from "../..";
import { parseDict } from "../../boc/dict/parseDict";

export function configParseMasterAddress(slice: Slice | null | undefined) {
    if (slice) {
        return new Address(-1, slice.readBuffer(32));
    } else {
        return null;
    }
}

export function configParseWorkchainDescriptor(slice: Slice) {
    if (slice.readUint(8).toNumber() !== 0xA6) {
        throw Error('Invalid config');
    }
    let enabledSince = slice.readUint(32).toNumber();
    let actialMinSplit = slice.readUint(8).toNumber();
    let min_split = slice.readUint(8).toNumber();
    let max_split = slice.readUint(8).toNumber();
    let basic = slice.readBit();
    let active = slice.readBit();
    let accept_msgs = slice.readBit();
    let flags = slice.readUint(13).toNumber();
    let zerostateRootHash = slice.readBuffer(32);
    let zerostateFileHash = slice.readBuffer(32);
    let version = slice.readUint(32).toNumber();

    // Only basic format supported
    if (slice.readBit()) {
        throw Error('Invalid config');
    }
    let vmVersion = slice.readUint(32).toNumber();
    let vmMode = slice.readUint(64);

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

function readPublicKey(slice: Slice) {
    // 8e81278a
    if (slice.readUint(32).toNumber() !== 0x8e81278a) {
        throw Error('Invalid config');
    }
    return slice.readBuffer(32);
}

export function parseValidatorDescr(slice: Slice) {
    let header = slice.readUint(8).toNumber();
    if (header === 0x53) {
        return {
            publicKey: readPublicKey(slice),
            weight: slice.readUint(64),
            adnlAddress: null
        };
    } else if (header === 0x73) {
        return {
            publicKey: readPublicKey(slice),
            weight: slice.readUint(64),
            adnlAddress: slice.readBuffer(32)
        };
    } else {
        throw Error('Invalid config');
    }
}

export function parseValidatorSet(slice: Slice) {
    let header = slice.readUint(8).toNumber();
    if (header === 0x11) {
        let timeSince = slice.readUint(32).toNumber();
        let timeUntil = slice.readUint(32).toNumber();
        let total = slice.readUint(16).toNumber();
        let main = slice.readUint(16).toNumber();
        let list = parseDict(slice.readRef(), 16, parseValidatorDescr);
        return {
            timeSince,
            timeUntil,
            total,
            main,
            totalWeight: null,
            list
        };
    } else if (header === 0x12) {
        let timeSince = slice.readUint(32).toNumber();
        let timeUntil = slice.readUint(32).toNumber();
        let total = slice.readUint(16).toNumber();
        let main = slice.readUint(16).toNumber();
        let totalWeight = slice.readUint(64);
        let exists = slice.readBit();
        let list = exists ? parseDict(slice.readRef(), 16, parseValidatorDescr) : null;
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

export function parseBridge(slice: Slice) {
    let bridgeAddress = slice.readBuffer(32);
    let oracleMultisigAddress = slice.readBuffer(32);
    let oracles = slice.readBit() ? parseDict(slice.readRef(), 256, (slice) => slice.readBuffer(32)) : null;
    let externalChainAddress = slice.readBuffer(32);
    return {
        bridgeAddress,
        oracleMultisigAddress,
        oracles,
        externalChainAddress
    }
}

export function configParseMasterAddressRequired(slice: Slice | null | undefined) {
    if (!slice) {
        throw Error('Invalid config');
    }
    return configParseMasterAddress(slice)!;
}

export function configParse15(slice: Slice | null | undefined) {
    if (!slice) {
        throw Error('Invalid config');
    }
    let validatorsElectedFor = slice.readUintNumber(32);
    let electorsStartBefore = slice.readUintNumber(32);
    let electorsEndBefore = slice.readUintNumber(32);
    let stakeHeldFor = slice.readUintNumber(32);
    return {
        validatorsElectedFor,
        electorsStartBefore,
        electorsEndBefore,
        stakeHeldFor
    };
}

export function configParse16(slice: Slice | null | undefined) {
    if (!slice) {
        throw Error('Invalid config');
    }

    let maxValidators = slice.readUintNumber(16);
    let maxMainValidators = slice.readUintNumber(16);
    let minValidators = slice.readUintNumber(16);
    return {
        maxValidators,
        maxMainValidators,
        minValidators
    };
}

export function configParse17(slice: Slice | null | undefined) {
    if (!slice) {
        throw Error('Invalid config');
    }

    let minStake = slice.readCoins();
    let maxStake = slice.readCoins();
    let maxStakeFactor = slice.readUintNumber(32);

    return {
        minStake,
        maxStake,
        maxStakeFactor
    };
}

export type StoragePrices = {
    utime_since: BN,
    bit_price_ps: BN,
    cell_price_ps: BN,
    mc_bit_price_ps: BN,
    mc_cell_price_ps: BN
}
export function configParse18(slice: Slice | null | undefined): StoragePrices[] {
    if (!slice) {
        throw Error('Invalid config');
    }

    let result: StoragePrices[] = [];
    parseDict(slice, 32, (slice) => {
        let utime_since = slice.readUint(32);
        let bit_price_ps = slice.readUint(64);
        let cell_price_ps = slice.readUint(64);
        let mc_bit_price_ps = slice.readUint(64);
        let mc_cell_price_ps = slice.readUint(64);
        return {
            utime_since,
            bit_price_ps,
            cell_price_ps,
            mc_bit_price_ps,
            mc_cell_price_ps
        };
    }).forEach(a => {
        result.push(a);
    });
    return result;
}

export function configParse8(slice: Slice | null | undefined) {
    if (!slice) {
        return {
            version: 0,
            capabilities: new BN(0)
        }
    }

    let version = slice.readUintNumber(32);
    let capabilities = slice.readUint(64);
    return {
        version,
        capabilities
    }
}

export function configParse40(slice: Slice | null | undefined) {
    if (!slice) {
        return null;
    }

    let header = slice.readUintNumber(8);
    if (header !== 1) {
        throw Error('Invalid config');
    }

    let defaultFlatFine = slice.readCoins();
    let defaultProportionaFine = slice.readCoins();
    let severityFlatMult = slice.readUintNumber(16);
    let severityProportionalMult = slice.readUintNumber(16);
    let unfunishableInterval = slice.readUintNumber(16);
    let longInterval = slice.readUintNumber(16);
    let longFlatMult = slice.readUintNumber(16);
    let longProportionalMult = slice.readUintNumber(16);
    let mediumInterval = slice.readUintNumber(16);
    let mediumFlatMult = slice.readUintNumber(16);
    let mediumProportionalMult = slice.readUintNumber(16);
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

export function configParse12(slice: Slice | null | undefined) {
    if (!slice) {
        throw Error('Invalid config');
    }
    if (slice.readUint(1).toNumber()) {
        return parseDict(slice.readRef(), 32, configParseWorkchainDescriptor);
    } else {
        throw Error('No workchains exist')
    }
}

export function configParseValidatorSet(slice: Slice | null | undefined) {
    if (!slice) {
        return null;
    }
    return parseValidatorSet(slice);
}

export function configParseBridge(slice: Slice | null | undefined) {
    if (!slice) {
        return null;
    }
    return parseBridge(slice);
}

function parseGasLimitsInternal(slice: Slice) {
    const tag = slice.readUintNumber(8);
    if (tag === 0xde) {
        const gasPrice = slice.readUint(64);
        const gasLimit = slice.readUint(64);
        const specialGasLimit = slice.readUint(64);
        const gasCredit = slice.readUint(64);
        const blockGasLimit = slice.readUint(64);
        const freezeDueLimit = slice.readUint(64);
        const deleteDueLimit = slice.readUint(64);
        return {
            gasPrice,
            gasLimit,
            specialGasLimit,
            gasCredit,
            blockGasLimit,
            freezeDueLimit,
            deleteDueLimit
        };
    } else if (tag === 0xdd) {
        const gasPrice = slice.readUint(64);
        const gasLimit = slice.readUint(64);
        const gasCredit = slice.readUint(64);
        const blockGasLimit = slice.readUint(64);
        const freezeDueLimit = slice.readUint(64);
        const deleteDueLimit = slice.readUint(64);
        return {
            gasPrice,
            gasLimit,
            gasCredit,
            blockGasLimit,
            freezeDueLimit,
            deleteDueLimit
        }
    } else {
        throw Error('Invalid config');
    }
}

export type GasLimitsPrices = ReturnType<typeof configParseGasLimitsPrices>;
export function configParseGasLimitsPrices(slice: Slice | null | undefined) {
    if (!slice) {
        throw Error('Invalid config');
    }
    const tag = slice.readUintNumber(8);
    if (tag === 0xd1) {
        const flatLimit = slice.readUint(64);
        const flatGasPrice = slice.readUint(64);
        const other = parseGasLimitsInternal(slice);
        return {
            flatLimit,
            flatGasPrice,
            other
        }
    } else {
        throw Error('Invalid config');
    }
}

export type MsgPrices = ReturnType<typeof configParseMsgPrices>
export function configParseMsgPrices(slice: Slice | null | undefined) {
    if (!slice) {
        throw new Error('Invalid config');
    }
    slice = slice.readRef();

    let magic = slice.readUintNumber(8);
    if (magic !== 0xea) {
        throw new Error('Invalid msg prices param');
    }
    return {
        lumpPrice: slice.readUint(64),
        bitPrice: slice.readUint(64),
        cellPrice: slice.readUint(64),
        ihrPriceFactor: slice.readUint(32),
        firstFrac: slice.readUint(16),
        nextFrac: slice.readUint(16)
    };
}

export function parseFullConfig(configs: Map<string, Slice>) {
    return {
        configAddress: configParseMasterAddressRequired(configs.get('0')),
        electorAddress: configParseMasterAddressRequired(configs.get('1')),
        minterAddress: configParseMasterAddress(configs.get('2')),
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
        gasPrices: {
            masterchain: configParseGasLimitsPrices(configs.get('20')),
            workchain: configParseGasLimitsPrices(configs.get('21')),
        },
        msgPrices: {
            masterchain: configParseMsgPrices(configs.get('24')),
            workchain: configParseMsgPrices(configs.get('25')),
        },
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
        },
        // TODO: mint_new_price:Grams mint_add_price:Grams = ConfigParam 6;
        // TODO: to_mint:ExtraCurrencyCollection = ConfigParam 7
        // TODO: mandatory_params:(Hashmap 32 True) = ConfigParam 9
        // TODO: critical_params:(Hashmap 32 True) = ConfigParam 10
        // TODO: ConfigVotingSetup = ConfigParam 11
        // TODO: ComplaintPricing = ConfigParam 13
        // TODO: BlockCreateFees = ConfigParam 14
    };
}