import { Address, Slice } from "ton-core";
import { parseDict } from "../../boc/dict/parseDict";

export function configParseMasterAddress(slice: Slice | null | undefined) {
    if (slice) {
        return new Address(-1, slice.loadBuffer(32));
    } else {
        return null;
    }
}

export function configParseWorkchainDescriptor(slice: Slice) {
    if (slice.loadUint(8) !== 0xA6) {
        throw Error('Invalid config');
    }
    let enabledSince = slice.loadUint(32);
    let actialMinSplit = slice.loadUint(8);
    let min_split = slice.loadUint(8);
    let max_split = slice.loadUint(8);
    let basic = slice.loadBit();
    let active = slice.loadBit();
    let accept_msgs = slice.loadBit();
    let flags = slice.loadUint(13);
    let zerostateRootHash = slice.loadBuffer(32);
    let zerostateFileHash = slice.loadBuffer(32);
    let version = slice.loadUint(32);

    // Only basic format supported
    if (slice.loadBit()) {
        throw Error('Invalid config');
    }
    let vmVersion = slice.loadUint(32);
    let vmMode = slice.loadUintBig(64);

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
    if (slice.loadUint(32) !== 0x8e81278a) {
        throw Error('Invalid config');
    }
    return slice.loadBuffer(32);
}

export function parseValidatorDescr(slice: Slice) {
    let header = slice.loadUint(8);
    if (header === 0x53) {
        return {
            publicKey: readPublicKey(slice),
            weight: slice.loadUintBig(64),
            adnlAddress: null
        };
    } else if (header === 0x73) {
        return {
            publicKey: readPublicKey(slice),
            weight: slice.loadUintBig(64),
            adnlAddress: slice.loadBuffer(32)
        };
    } else {
        throw Error('Invalid config');
    }
}

export function parseValidatorSet(slice: Slice) {
    let header = slice.loadUint(8);
    if (header === 0x11) {
        let timeSince = slice.loadUint(32);
        let timeUntil = slice.loadUint(32);
        let total = slice.loadUint(16);
        let main = slice.loadUint(16);
        let list = parseDict(slice.loadRef(), 16, parseValidatorDescr);
        return {
            timeSince,
            timeUntil,
            total,
            main,
            totalWeight: null,
            list
        };
    } else if (header === 0x12) {
        let timeSince = slice.loadUint(32);
        let timeUntil = slice.loadUint(32);
        let total = slice.loadUint(16);
        let main = slice.loadUint(16);
        let totalWeight = slice.loadUintBig(64);
        let exists = slice.loadBit();
        let list = exists ? parseDict(slice.loadRef(), 16, parseValidatorDescr) : null;
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
    let bridgeAddress = slice.loadBuffer(32);
    let oracleMultisigAddress = slice.loadBuffer(32);
    let oracles = slice.loadBit() ? parseDict(slice.loadRef(), 256, (slice) => slice.loadBuffer(32)) : null;
    let externalChainAddress = slice.loadBuffer(32);
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
    let validatorsElectedFor = slice.loadUint(32);
    let electorsStartBefore = slice.loadUint(32);
    let electorsEndBefore = slice.loadUint(32);
    let stakeHeldFor = slice.loadUint(32);
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

    let maxValidators = slice.loadUint(16);
    let maxMainValidators = slice.loadUint(16);
    let minValidators = slice.loadUint(16);
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

    let minStake = slice.loadCoins();
    let maxStake = slice.loadCoins();
    let minTotalStake = slice.loadCoins();
    let maxStakeFactor = slice.loadUint(32);

    return {
        minStake,
        maxStake,
        minTotalStake,
        maxStakeFactor
    };
}

export type StoragePrices = {
    utime_since: number,
    bit_price_ps: bigint,
    cell_price_ps: bigint,
    mc_bit_price_ps: bigint,
    mc_cell_price_ps: bigint
}
export function configParse18(slice: Slice | null | undefined): StoragePrices[] {
    if (!slice) {
        throw Error('Invalid config');
    }

    let result: StoragePrices[] = [];
    parseDict(slice.asCell(), 32, (slice) => {
        let header = slice.loadUint(8);
        if (header !== 0xcc) {
            throw Error('Invalid config');
        }
        let utime_since = slice.loadUint(32);
        let bit_price_ps = slice.loadUintBig(64);
        let cell_price_ps = slice.loadUintBig(64);
        let mc_bit_price_ps = slice.loadUintBig(64);
        let mc_cell_price_ps = slice.loadUintBig(64);
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
            capabilities: 0n
        }
    }

    let version = slice.loadUint(32);
    let capabilities = slice.loadUintBig(64);
    return {
        version,
        capabilities
    }
}

export function configParse40(slice: Slice | null | undefined) {
    if (!slice) {
        return null;
    }

    let header = slice.loadUint(8);
    if (header !== 1) {
        throw Error('Invalid config');
    }

    let defaultFlatFine = slice.loadCoins();
    let defaultProportionaFine = slice.loadCoins();
    let severityFlatMult = slice.loadUint(16);
    let severityProportionalMult = slice.loadUint(16);
    let unfunishableInterval = slice.loadUint(16);
    let longInterval = slice.loadUint(16);
    let longFlatMult = slice.loadUint(16);
    let longProportionalMult = slice.loadUint(16);
    let mediumInterval = slice.loadUint(16);
    let mediumFlatMult = slice.loadUint(16);
    let mediumProportionalMult = slice.loadUint(16);
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
    if (slice.loadBit()) {
        return parseDict(slice.loadRef(), 32, configParseWorkchainDescriptor);
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
    const tag = slice.loadUint(8);
    if (tag === 0xde) {
        const gasPrice = slice.loadUintBig(64);
        const gasLimit = slice.loadUintBig(64);
        const specialGasLimit = slice.loadUintBig(64);
        const gasCredit = slice.loadUintBig(64);
        const blockGasLimit = slice.loadUintBig(64);
        const freezeDueLimit = slice.loadUintBig(64);
        const deleteDueLimit = slice.loadUintBig(64);
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
        const gasPrice = slice.loadUintBig(64);
        const gasLimit = slice.loadUintBig(64);
        const gasCredit = slice.loadUintBig(64);
        const blockGasLimit = slice.loadUintBig(64);
        const freezeDueLimit = slice.loadUintBig(64);
        const deleteDueLimit = slice.loadUintBig(64);
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
    const tag = slice.loadUint(8);
    if (tag === 0xd1) {
        const flatLimit = slice.loadUintBig(64);
        const flatGasPrice = slice.loadUintBig(64);
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
    let magic = slice.loadUint(8);
    if (magic !== 0xea) {
        throw new Error('Invalid msg prices param');
    }
    return {
        lumpPrice: slice.loadUintBig(64),
        bitPrice: slice.loadUintBig(64),
        cellPrice: slice.loadUintBig(64),
        ihrPriceFactor: slice.loadUint(32),
        firstFrac: slice.loadUint(16),
        nextFrac: slice.loadUint(16)
    };
}

// catchain_config#c1 mc_catchain_lifetime:uint32 shard_catchain_lifetime:uint32 
//   shard_validators_lifetime:uint32 shard_validators_num:uint32 = CatchainConfig;

// catchain_config_new#c2 flags:(## 7) { flags = 0 } shuffle_mc_validators:Bool
//   mc_catchain_lifetime:uint32 shard_catchain_lifetime:uint32
//   shard_validators_lifetime:uint32 shard_validators_num:uint32 = CatchainConfig;


export function configParse28(slice: Slice | null | undefined) {
    if (!slice) {
        throw new Error('Invalid config');
    }
    let magic = slice.loadUint(8);
    if (magic === 0xc1) {
        let masterCatchainLifetime = slice.loadUint(32);
        let shardCatchainLifetime = slice.loadUint(32);
        let shardValidatorsLifetime = slice.loadUint(32);
        let shardValidatorsCount = slice.loadUint(32);
        return {
            masterCatchainLifetime,
            shardCatchainLifetime,
            shardValidatorsLifetime,
            shardValidatorsCount
        };
    }
    if (magic === 0xc2) {
        let flags = slice.loadUint(7);
        let suffleMasterValidators = slice.loadBit();
        let masterCatchainLifetime = slice.loadUint(32);
        let shardCatchainLifetime = slice.loadUint(32);
        let shardValidatorsLifetime = slice.loadUint(32);
        let shardValidatorsCount = slice.loadUint(32);
        return {
            flags,
            suffleMasterValidators,
            masterCatchainLifetime,
            shardCatchainLifetime,
            shardValidatorsLifetime,
            shardValidatorsCount
        }
    }
    throw new Error('Invalid config');
}

// consensus_config#d6 round_candidates:# { round_candidates >= 1 }
//   next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
//   fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
//   max_block_bytes:uint32 max_collated_bytes:uint32 = ConsensusConfig;

// consensus_config_new#d7 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
//   round_candidates:(## 8) { round_candidates >= 1 }
//   next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
//   fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
//   max_block_bytes:uint32 max_collated_bytes:uint32 = ConsensusConfig;

// consensus_config_v3#d8 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
//   round_candidates:(## 8) { round_candidates >= 1 }
//   next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
//   fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
//   max_block_bytes:uint32 max_collated_bytes:uint32 
//   proto_version:uint16 = ConsensusConfig;

export function configParse29(slice: Slice | null | undefined) {
    if (!slice) {
        throw new Error('Invalid config');
    }
    let magic = slice.loadUint(8);
    if (magic === 0xd6) {
        let roundCandidates = slice.loadUint(32);
        let nextCandidateDelay = slice.loadUint(32);
        let consensusTimeout = slice.loadUint(32);
        let fastAttempts = slice.loadUint(32);
        let attemptDuration = slice.loadUint(32);
        let catchainMaxDeps = slice.loadUint(32);
        let maxBlockBytes = slice.loadUint(32);
        let maxColaltedBytes = slice.loadUint(32);
        return {
            roundCandidates,
            nextCandidateDelay,
            consensusTimeout,
            fastAttempts,
            attemptDuration,
            catchainMaxDeps,
            maxBlockBytes,
            maxColaltedBytes
        }
    } else if (magic === 0xd7) {
        let flags = slice.loadUint(7);
        let newCatchainIds = slice.loadBit();
        let roundCandidates = slice.loadUint(8);
        let nextCandidateDelay = slice.loadUint(32);
        let consensusTimeout = slice.loadUint(32);
        let fastAttempts = slice.loadUint(32);
        let attemptDuration = slice.loadUint(32);
        let catchainMaxDeps = slice.loadUint(32);
        let maxBlockBytes = slice.loadUint(32);
        let maxColaltedBytes = slice.loadUint(32);
        return {
            flags,
            newCatchainIds,
            roundCandidates,
            nextCandidateDelay,
            consensusTimeout,
            fastAttempts,
            attemptDuration,
            catchainMaxDeps,
            maxBlockBytes,
            maxColaltedBytes
        }
    } else if (magic === 0xd8) {
        let flags = slice.loadUint(7);
        let newCatchainIds = slice.loadBit();
        let roundCandidates = slice.loadUint(8);
        let nextCandidateDelay = slice.loadUint(32);
        let consensusTimeout = slice.loadUint(32);
        let fastAttempts = slice.loadUint(32);
        let attemptDuration = slice.loadUint(32);
        let catchainMaxDeps = slice.loadUint(32);
        let maxBlockBytes = slice.loadUint(32);
        let maxColaltedBytes = slice.loadUint(32);
        let protoVersion = slice.loadUint(16);
        return {
            flags,
            newCatchainIds,
            roundCandidates,
            nextCandidateDelay,
            consensusTimeout,
            fastAttempts,
            attemptDuration,
            catchainMaxDeps,
            maxBlockBytes,
            maxColaltedBytes,
            protoVersion
        }
    } else if (magic === 0xd9) {
        let flags = slice.loadUint(7);
        let newCatchainIds = slice.loadBit();
        let roundCandidates = slice.loadUint(8);
        let nextCandidateDelay = slice.loadUint(32);
        let consensusTimeout = slice.loadUint(32);
        let fastAttempts = slice.loadUint(32);
        let attemptDuration = slice.loadUint(32);
        let catchainMaxDeps = slice.loadUint(32);
        let maxBlockBytes = slice.loadUint(32);
        let maxColaltedBytes = slice.loadUint(32);
        let protoVersion = slice.loadUint(16);
        let catchainMaxBlocksCoeff = slice.loadUint(32);
        return {
            flags,
            newCatchainIds,
            roundCandidates,
            nextCandidateDelay,
            consensusTimeout,
            fastAttempts,
            attemptDuration,
            catchainMaxDeps,
            maxBlockBytes,
            maxColaltedBytes,
            protoVersion,
            catchainMaxBlocksCoeff
        }
    }
    throw new Error('Invalid config');
}

// cfg_vote_cfg#36 min_tot_rounds:uint8 max_tot_rounds:uint8 min_wins:uint8 max_losses:uint8 min_store_sec:uint32 max_store_sec:uint32 bit_price:uint32 cell_price:uint32 = ConfigProposalSetup;
export function parseProposalSetup(slice: Slice) {
    let magic = slice.loadUint(8);
    if (magic !== 0x36) {
        throw new Error('Invalid config');
    }
    let minTotalRounds = slice.loadUint(8);
    let maxTotalRounds = slice.loadUint(8);
    let minWins = slice.loadUint(8);
    let maxLoses = slice.loadUint(8);
    let minStoreSec = slice.loadUint(32);
    let maxStoreSec = slice.loadUint(32);
    let bitPrice = slice.loadUint(32);
    let cellPrice = slice.loadUint(32);
    return { minTotalRounds, maxTotalRounds, minWins, maxLoses, minStoreSec, maxStoreSec, bitPrice, cellPrice };
}

// cfg_vote_setup#91 normal_params:^ConfigProposalSetup critical_params:^ConfigProposalSetup = ConfigVotingSetup;
export function parseVotingSetup(slice: Slice | null | undefined) {
    if (!slice) {
        throw new Error('Invalid config');
    }
    let magic = slice.loadUint(8);
    if (magic !== 0x91) {
        throw new Error('Invalid config');
    }
    let normalParams = parseProposalSetup(slice.loadRef().beginParse());
    let criticalParams = parseProposalSetup(slice.loadRef().beginParse());
    return { normalParams, criticalParams };
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
        voting: parseVotingSetup(configs.get('11')),
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
        catchain: configParse28(configs.get('28')),
        consensus: configParse29(configs.get('29'))
        // TODO: mint_new_price:Grams mint_add_price:Grams = ConfigParam 6;
        // TODO: to_mint:ExtraCurrencyCollection = ConfigParam 7
        // TODO: mandatory_params:(Hashmap 32 True) = ConfigParam 9
        // TODO: critical_params:(Hashmap 32 True) = ConfigParam 10
        // TODO: ConfigVotingSetup = ConfigParam 11
        // TODO: ComplaintPricing = ConfigParam 13
        // TODO: BlockCreateFees = ConfigParam 14
    };
}