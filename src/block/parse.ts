import BN from "bn.js";
import { Address, Cell, Slice } from "..";
import { parseDict } from "../boc/dict/parseDict";


// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L243
// acc_state_uninit$00 = AccountStatus;
// acc_state_frozen$01 = AccountStatus;
// acc_state_active$10 = AccountStatus;
// acc_state_nonexist$11 = AccountStatus;
export type RawAccountStatus = 'uninitialized' | 'frozen' | 'active' | 'non-existing';
export function parseAccountStatus(slice: Slice): RawAccountStatus {
    const status = slice.readUintNumber(2);
    if (status === 0x00) {
        return 'uninitialized';
    }
    if (status === 0x01) {
        return 'frozen';
    }
    if (status === 0x02) {
        return 'active';
    }
    if (status === 0x03) {
        return 'non-existing';
    }
    throw Error('Invalid data');
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L120
// extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32)) 
//  = ExtraCurrencyCollection;
//  currencies$_ grams:Grams other:ExtraCurrencyCollection 
//            = CurrencyCollection;
export type RawCurrencyCollection = { extraCurrencies: Map<number, number> | null, coins: BN };
export function parseCurrencyCollection(slice: Slice): RawCurrencyCollection {
    const coins = slice.readCoins();

    // Read extra currencies
    let extraCurrencies: Map<number, number> | null = null;
    if (slice.readBit()) {
        let dc = slice.readCell();
        if (!dc.isExotic) {
            let pd = parseDict(dc.beginParse(), 32, (s) => s.readVarUIntNumber(5));
            extraCurrencies = new Map();
            for (let e of pd) {
                extraCurrencies.set(parseInt(e[0], 10), e[1]);
            }
        }
    }

    return { extraCurrencies, coins };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L123
// int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
//  src:MsgAddressInt dest:MsgAddressInt 
//  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
//  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
// ext_in_msg_info$10 src:MsgAddressExt dest:MsgAddressInt 
//  import_fee:Grams = CommonMsgInfo;
// ext_out_msg_info$11 src:MsgAddressInt dest:MsgAddressExt
//  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
export type RawCommonMessageInfo =
    | {
        type: 'internal',
        ihrDisabled: boolean,
        bounce: boolean,
        bounced: boolean,
        src: Address | null,
        dest: Address | null,
        value: RawCurrencyCollection,
        ihrFee: BN,
        fwdFee: BN,
        createdLt: BN,
        createdAt: number
    }
    | {
        type: 'external-out',
        src: Address | null,
        dest: Address | null,
        createdLt: BN,
        createdAt: number
    }
    | {
        type: 'external-in',
        src: Address | null,
        dest: Address | null,
        importFee: BN
    };
export function parseCommonMsgInfo(slice: Slice): RawCommonMessageInfo {

    if (!slice.readBit()) {
        // Internal
        let ihrDisabled = slice.readBit();
        let bounce = slice.readBit();
        let bounced = slice.readBit();
        let src = slice.readAddress();
        let dest = slice.readAddress();
        let value = parseCurrencyCollection(slice);
        let ihrFee = slice.readCoins();
        let fwdFee = slice.readCoins();
        let createdLt = slice.readUint(64);
        let createdAt = slice.readUintNumber(32);
        return {
            type: 'internal',
            ihrDisabled,
            bounce,
            bounced,
            src,
            dest,
            value,
            ihrFee,
            fwdFee,
            createdLt,
            createdAt
        }
    } else if (slice.readBit()) {
        // Outgoing external
        let src = slice.readAddress();
        let dest = slice.readAddress();
        let createdLt = slice.readUint(64);
        let createdAt = slice.readUintNumber(32);
        return {
            type: 'external-out',
            src,
            dest,
            createdLt,
            createdAt
        }
    } else {
        // Incoming external
        let src = slice.readAddress();
        let dest = slice.readAddress();
        let importFee = slice.readCoins()
        return {
            type: 'external-in',
            src,
            dest,
            importFee
        }
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L139
// tick_tock$_ tick:Bool tock:Bool = TickTock;
export type RawTickTock = { tick: boolean, tock: boolean };
export function parseRawTickTock(slice: Slice): RawTickTock {
    return {
        tick: slice.readBit(),
        tock: slice.readBit()
    };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L141
// _ split_depth:(Maybe (## 5)) special:(Maybe TickTock)
//  code:(Maybe ^Cell) data:(Maybe ^Cell)
//  library:(HashmapE 256 SimpleLib) = StateInit;
export type RawStateInit = { splitDepth: number | null, code: Cell | null, data: Cell | null, special: RawTickTock | null, raw: Cell };
export function parseStateInit(slice: Slice): RawStateInit {
    let raw = slice.toCell();
    let splitDepth: number | null = null;
    if (slice.readBit()) {
        splitDepth = slice.readUintNumber(5);
    }
    const special = slice.readBit() ? parseRawTickTock(slice) : null;
    const hasCode = slice.readBit();
    const code = hasCode ? slice.readCell() : null;
    const hasData = slice.readBit();
    const data = hasData ? slice.readCell() : null;
    if (slice.readBit()) {
        slice.readCell(); // Skip libraries for now
    }

    return { splitDepth, data, code, special, raw };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L147
// message$_ {X:Type} info:CommonMsgInfo
//  init:(Maybe (Either StateInit ^StateInit))
//  body:(Either X ^X) = Message X;
export type RawMessage = {
    raw: Cell;
    info: RawCommonMessageInfo,
    init: RawStateInit | null,
    body: Cell
};
export function parseMessage(slice: Slice): RawMessage {
    const raw = slice.toCell();
    const info = parseCommonMsgInfo(slice);
    const hasInit = slice.readBit();
    let init: RawStateInit | null = null;
    if (hasInit) {
        if (!slice.readBit()) {
            init = parseStateInit(slice);
        } else {
            init = parseStateInit(slice.readRef());
        }
    }
    const body = slice.readBit() ? slice.readRef().toCell() : slice.toCell();

    return {
        info,
        init,
        body,
        raw
    };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L273
// update_hashes#72 {X:Type} old_hash:bits256 new_hash:bits256
//  = HASH_UPDATE X;
export type RawHashUpdate = { oldHash: Buffer, newHash: Buffer };
export function parseHashUpdate(slice: Slice): RawHashUpdate {
    if (slice.readUintNumber(8) !== 0x72) {
        throw Error('Invalid data');
    }
    const oldHash = slice.readBuffer(32);
    const newHash = slice.readBuffer(32);
    return { oldHash, newHash };
}

// acst_unchanged$0 = AccStatusChange;  // x -> x
// acst_frozen$10 = AccStatusChange;    // init -> frozen
// acst_deleted$11 = AccStatusChange;   // frozen -> deleted
export type RawAccountStatusChange = 'unchanged' | 'frozen' | 'deleted';
export function parseAccountChange(slice: Slice): RawAccountStatusChange {
    if (!slice.readBit()) {
        return 'unchanged';
    }
    if (slice.readBit()) {
        return 'frozen';
    } else {
        return 'deleted';
    }
}

// storage_used_short$_ cells:(VarUInteger 7) 
//  bits:(VarUInteger 7) = StorageUsedShort;
export type RawStorageUsedShort = { cells: number, bits: number };
export function parseStorageUsedShort(slice: Slice): RawStorageUsedShort {
    return {
        cells: slice.readVarUIntNumber(3),
        bits: slice.readVarUIntNumber(3)
    }
}

// tr_phase_storage$_ storage_fees_collected:Grams 
//   storage_fees_due:(Maybe Grams)
//   status_change:AccStatusChange
//   = TrStoragePhase;
export type RawStoragePhase = { storageFeesCollected: BN, storageFeesDue: BN | null, statusChange: RawAccountStatusChange };
export function parseStoragePhase(slice: Slice): RawStoragePhase {
    const storageFeesCollected = slice.readCoins();
    let storageFeesDue: BN | null = null;
    if (slice.readBit()) {
        storageFeesDue = slice.readCoins();
    }
    const statusChange = parseAccountChange(slice);
    return {
        storageFeesCollected,
        storageFeesDue,
        statusChange
    }
}

// tr_phase_credit$_ due_fees_collected:(Maybe Grams)
//   credit:CurrencyCollection = TrCreditPhase;
export type RawCreditPhase = { dueFeesColelcted: BN | null, credit: RawCurrencyCollection };
export function parseCreditPhase(slice: Slice): RawCreditPhase {
    let dueFeesColelcted = slice.readBit() ? slice.readCoins() : null;
    const credit = parseCurrencyCollection(slice);
    return {
        dueFeesColelcted,
        credit
    }
}


// tr_phase_compute_skipped$0 reason:ComputeSkipReason
//   = TrComputePhase;
// tr_phase_compute_vm$1 success:Bool msg_state_used:Bool 
//   account_activated:Bool gas_fees:Grams
//   ^[ gas_used:(VarUInteger 7)
//      gas_limit:(VarUInteger 7) gas_credit:(Maybe (VarUInteger 3))
//      mode:int8 exit_code:int32 exit_arg:(Maybe int32)
//      vm_steps:uint32
//      vm_init_state_hash:bits256 vm_final_state_hash:bits256 ]
//   = TrComputePhase;
//  cskip_no_state$00 = ComputeSkipReason;
//  cskip_bad_state$01 = ComputeSkipReason;
//  cskip_no_gas$10 = ComputeSkipReason;
export type RawComputePhase =
    | {
        type: 'skipped',
        reason: 'no-state' | 'bad-state' | 'no-gas'
    }
    | {
        type: 'computed',
        success: boolean,
        messageStateUsed: boolean,
        accountActivated: boolean,
        gasFees: BN,
        gasUsed: BN,
        gasLimit: BN,
        gasCredit: BN | null,
        mode: number,
        exitCode: number,
        exitArg: number | null,
        vmSteps: number,
        vmInitStateHash: Buffer,
        vmFinalStateHash: Buffer
    };
export function parseComputePhase(slice: Slice): RawComputePhase {
    if (!slice.readBit()) {
        const skipReason = slice.readUintNumber(2);
        if (skipReason === 0x00) {
            return {
                type: 'skipped',
                reason: 'no-state'
            }
        }
        if (skipReason === 0x01) {
            return {
                type: 'skipped',
                reason: 'bad-state'
            }
        }
        if (skipReason === 0x02) {
            return {
                type: 'skipped',
                reason: 'no-gas'
            }
        }
    }

    const success = slice.readBit();
    const messageStateUsed = slice.readBit();
    const accountActivated = slice.readBit();
    let gasFees = slice.readCoins();

    const vmState = slice.readRef();
    let gasUsed = vmState.readVarUInt(3);
    let gasLimit = vmState.readVarUInt(3);
    let gasCredit = vmState.readBit() ? vmState.readVarUInt(2) : null;
    let mode = vmState.readUintNumber(8);
    let exitCode = vmState.readUintNumber(32);
    let exitArg = vmState.readBit() ? vmState.readUintNumber(32) : null; // TODO: change to int
    let vmSteps = vmState.readUintNumber(32);
    let vmInitStateHash = vmState.readBuffer(32);
    let vmFinalStateHash = vmState.readBuffer(32);

    return {
        type: 'computed',
        success,
        messageStateUsed,
        accountActivated,
        gasFees,
        gasUsed,
        gasLimit,
        gasCredit,
        mode,
        exitCode,
        exitArg,
        vmSteps,
        vmInitStateHash,
        vmFinalStateHash
    }
}

// tr_phase_action$_ success:Bool valid:Bool no_funds:Bool
//   status_change:AccStatusChange
//   total_fwd_fees:(Maybe Grams) total_action_fees:(Maybe Grams)
//   result_code:int32 result_arg:(Maybe int32) tot_actions:uint16
//   spec_actions:uint16 skipped_actions:uint16 msgs_created:uint16 
//   action_list_hash:bits256 tot_msg_size:StorageUsedShort 
//   = TrActionPhase;

export type RawActionPhase = {
    success: boolean,
    valid: boolean,
    noFunds: boolean,
    statusChange: RawAccountStatusChange,
    totalFwdFees: BN | null,
    totalActionFees: BN | null,
    resultCode: number,
    resultArg: number | null,
    totalActions: number,
    specialActions: number,
    skippedActions: number,
    messagesCreated: number,
    actionListHash: Buffer,
    totalMessageSizes: RawStorageUsedShort
};
export function parseActionPhase(slice: Slice): RawActionPhase {
    const success = slice.readBit();
    const valid = slice.readBit();
    const noFunds = slice.readBit();
    const statusChange = parseAccountChange(slice);
    const totalFwdFees = slice.readBit() ? slice.readCoins() : null;
    const totalActionFees = slice.readBit() ? slice.readCoins() : null;
    const resultCode = slice.readUintNumber(32); // TODO: Change to int32
    const resultArg = slice.readBit() ? slice.readUintNumber(32) : null; // TODO: Change to int32
    const totalActions = slice.readUintNumber(16);
    const specialActions = slice.readUintNumber(16);
    const skippedActions = slice.readUintNumber(16);
    const messagesCreated = slice.readUintNumber(16);
    const actionListHash = slice.readBuffer(32);
    const totalMessageSizes = parseStorageUsedShort(slice);

    return {
        success,
        valid,
        noFunds,
        statusChange,
        totalFwdFees,
        totalActionFees,
        resultCode,
        resultArg,
        totalActions,
        specialActions,
        skippedActions,
        messagesCreated,
        actionListHash,
        totalMessageSizes
    }
}

// tr_phase_bounce_negfunds$00 = TrBouncePhase;
// tr_phase_bounce_nofunds$01 msg_size:StorageUsedShort req_fwd_fees:Grams = TrBouncePhase;
// tr_phase_bounce_ok$1 msg_size:StorageUsedShort msg_fees:Grams fwd_fees:Grams = TrBouncePhase;
export type RawBouncePhase =
    | { type: 'ok', msgSize: RawStorageUsedShort, msgFees: BN, fwdFees: BN }
    | { type: 'no-funds', msgSize: RawStorageUsedShort, fwdFees: BN }
    | { type: 'negative-funds' };
export function parseBouncePhase(slice: Slice): RawBouncePhase {

    // Is OK
    if (slice.readBit()) {
        const msgSize = parseStorageUsedShort(slice);
        const msgFees = slice.readCoins();
        const fwdFees = slice.readCoins();
        return {
            type: 'ok',
            msgSize,
            msgFees,
            fwdFees
        }
    }

    // No funds
    if (slice.readBit()) {
        const msgSize = parseStorageUsedShort(slice);
        const fwdFees = slice.readCoins();
        return {
            type: 'no-funds',
            msgSize,
            fwdFees
        }
    }

    return {
        type: 'negative-funds'
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L324
// trans_ord$0000 credit_first:Bool
//   storage_ph:(Maybe TrStoragePhase)
//   credit_ph:(Maybe TrCreditPhase)
//   compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
//   aborted:Bool bounce:(Maybe TrBouncePhase)
//   destroyed:Bool
//   = TransactionDescr;

// trans_storage$0001 storage_ph:TrStoragePhase
//   = TransactionDescr;

// trans_tick_tock$001 is_tock:Bool storage_ph:TrStoragePhase
//   compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
//   aborted:Bool destroyed:Bool = TransactionDescr;

// split_merge_info$_ cur_shard_pfx_len:(## 6)
//   acc_split_depth:(## 6) this_addr:bits256 sibling_addr:bits256
//   = SplitMergeInfo;

// trans_split_prepare$0100 split_info:SplitMergeInfo
//   storage_ph:(Maybe TrStoragePhase)
//   compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
//   aborted:Bool destroyed:Bool
//   = TransactionDescr;

// trans_split_install$0101 split_info:SplitMergeInfo
//   prepare_transaction:^Transaction
//   installed:Bool = TransactionDescr;

// trans_merge_prepare$0110 split_info:SplitMergeInfo
//   storage_ph:TrStoragePhase aborted:Bool
//   = TransactionDescr;

// trans_merge_install$0111 split_info:SplitMergeInfo
//   prepare_transaction:^Transaction
//   storage_ph:(Maybe TrStoragePhase)
//   credit_ph:(Maybe TrCreditPhase)
//   compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
//   aborted:Bool destroyed:Bool
//   = TransactionDescr;
export type RawTransactionDescription =
    | {
        type: 'generic',
        creditFirst: boolean,
        storagePhase: RawStoragePhase | null,
        creditPhase: RawCreditPhase | null,
        computePhase: RawComputePhase,
        actionPhase: RawActionPhase | null,
        bouncePhase: RawBouncePhase | null,
        aborted: boolean,
        destroyed: boolean
    }
    | {
        type: 'storage',
        storagePhase: RawStoragePhase
    }
    | {
        type: 'tick-tock',
        isTock: boolean,
        storagePhase: RawStoragePhase,
        computePhase: RawComputePhase,
        actionPhase: RawActionPhase | null,
        aborted: boolean,
        destroyed: boolean
    };
export function parseTransactionDescription(slice: Slice): RawTransactionDescription {
    const type = slice.readUintNumber(4);
    if (type === 0x00) {
        const creditFirst = slice.readBit();
        let storagePhase: RawStoragePhase | null = null;
        let creditPhase: RawCreditPhase | null = null;
        if (slice.readBit()) {
            storagePhase = parseStoragePhase(slice);
        }
        if (slice.readBit()) {
            creditPhase = parseCreditPhase(slice);
        }
        let computePhase: RawComputePhase = parseComputePhase(slice);
        let actionPhase: RawActionPhase | null = null;
        if (slice.readBit()) {
            actionPhase = parseActionPhase(slice.readRef());
        }
        let aborted = slice.readBit();
        let bouncePhase: RawBouncePhase | null = null;
        if (slice.readBit()) {
            bouncePhase = parseBouncePhase(slice);
        }
        const destroyed = slice.readBit();
        return {
            type: 'generic',
            creditFirst,
            storagePhase,
            creditPhase,
            computePhase,
            actionPhase,
            bouncePhase,
            aborted,
            destroyed
        }
    }
    if (type === 0x01) {
        let storagePhase: RawStoragePhase = parseStoragePhase(slice);
        return {
            type: 'storage',
            storagePhase
        }
    }
    if (type === 0x2 || type === 0x03) {
        const isTock = type === 0x03;
        let storagePhase: RawStoragePhase = parseStoragePhase(slice);
        let computePhase: RawComputePhase = parseComputePhase(slice);
        let actionPhase: RawActionPhase | null = null;
        if (slice.readBit()) {
            actionPhase = parseActionPhase(slice.readRef());
        }
        const aborted = slice.readBit();
        const destroyed = slice.readBit();
        return {
            type: 'tick-tock',
            isTock,
            storagePhase,
            computePhase,
            actionPhase,
            aborted,
            destroyed
        }
    }
    throw Error('Unsupported transaction type');
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L263
// transaction$0111 account_addr:bits256 lt:uint64 
//  prev_trans_hash:bits256 prev_trans_lt:uint64 now:uint32
//  outmsg_cnt:uint15
//  orig_status:AccountStatus end_status:AccountStatus
//  ^[ in_msg:(Maybe ^(Message Any)) out_msgs:(HashmapE 15 ^(Message Any)) ]
//  total_fees:CurrencyCollection state_update:^(HASH_UPDATE Account)
//  description:^TransactionDescr = Transaction;
export type RawTransaction = {
    address: Address,
    lt: BN,
    prevTransaction: {
        lt: BN,
        hash: Buffer
    }
    time: number,
    outMessagesCount: number,
    oldStatus: RawAccountStatus,
    newStatus: RawAccountStatus,
    fees: RawCurrencyCollection,
    update: RawHashUpdate,
    description: RawTransactionDescription,
    inMessage: RawMessage | null,
    outMessages: RawMessage[]
};
export function parseTransaction(workchain: number, slice: Slice): RawTransaction {
    if (slice.readUintNumber(4) !== 0x07) {
        throw Error('Invalid data');
    }

    // Read address
    const addressHash = slice.readBuffer(32);
    const address = new Address(workchain, addressHash);

    // Read lt
    const lt = slice.readUint(64);

    // Read prevTrans
    const prevTransHash = slice.readBuffer(32);
    const prevTransLt = slice.readUint(64);

    // Read time
    const time = slice.readUintNumber(32);

    // Output messages
    const outMessagesCount = slice.readUintNumber(15);

    // Status
    const oldStatus = parseAccountStatus(slice);
    const newStatus = parseAccountStatus(slice);

    // Messages ref
    const messages = slice.readRef();
    let hasInMessage = messages.readBit();
    let hasOutMessages = messages.readBit();
    let inMessage: RawMessage | null = null;
    if (hasInMessage) {
        inMessage = parseMessage(messages.readRef());
    }
    let outMessages: RawMessage[] = [];
    if (hasOutMessages) {
        let dict = messages.readDict(15, (slice) => parseMessage(slice.readRef()));
        for (let msg of Array.from(dict.values())) {
            outMessages.push(msg);
        }
    }

    // Currency collections
    let fees = parseCurrencyCollection(slice);

    // Hash update
    let update = parseHashUpdate(slice.readRef());

    // Description
    let description = parseTransactionDescription(slice.readRef());

    return {
        address,
        lt,
        time,
        outMessagesCount,

        oldStatus,
        newStatus,

        fees,

        update,

        description,

        inMessage,
        outMessages,

        prevTransaction: {
            hash: prevTransHash,
            lt: prevTransLt
        }
    };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L222
// storage_used$_ cells:(VarUInteger 7) bits:(VarUInteger 7) 
//  public_cells:(VarUInteger 7) = StorageUsed;
export type RawStorageUsed = {
    cells: number,
    bits: number,
    publicCells: number
};
export function parseStorageUsed(cs: Slice): RawStorageUsed {
    return {
        cells: cs.readVarUIntNumber(3),
        bits: cs.readVarUIntNumber(3),
        publicCells: cs.readVarUIntNumber(3),
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L228
// storage_info$_ used:StorageUsed last_paid:uint32
//  due_payment:(Maybe Grams) = StorageInfo;
export type RawStorageInfo = {
    used: RawStorageUsed,
    lastPaid: number,
    duePayment: BN | null
};
export function parseStorageInfo(cs: Slice): RawStorageInfo {
    return {
        used: parseStorageUsed(cs),
        lastPaid: cs.readUintNumber(32),
        duePayment: cs.readBit() ? cs.readCoins() : null
    };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L239
// account_uninit$00 = AccountState;
// account_active$1 _:StateInit = AccountState;
// account_frozen$01 state_hash:bits256 = AccountState;
export type RawAccountState =
    | { type: 'uninit' }
    | { type: 'active', state: RawStateInit }
    | { type: 'frozen', stateHash: Buffer };
export function parseAccountState(cs: Slice): RawAccountState {
    if (cs.readBit()) {
        return { type: 'active', state: parseStateInit(cs) };
    } else if (cs.readBit()) {
        return { type: 'frozen', stateHash: cs.readBuffer(32) };
    } else {
        return { type: 'uninit' };
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L235
// account_storage$_ last_trans_lt:uint64 balance:CurrencyCollection state:AccountState 
//   = AccountStorage;
export type RawAccountStorage = {
    lastTransLt: BN,
    balance: RawCurrencyCollection
    state: RawAccountState
}
export function parseAccountStorage(cs: Slice): RawAccountStorage {
    return { lastTransLt: cs.readUint(64), balance: parseCurrencyCollection(cs), state: parseAccountState(cs) };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L231
// account_none$0 = Account;
// account$1 addr:MsgAddressInt storage_stat:StorageInfo
//  storage:AccountStorage = Account;
export type RawAccount = {
    addr: Address | null,
    storageStat: RawStorageInfo,
    storage: RawAccountStorage
}
export function parseAccount(cs: Slice) {
    if (cs.readBit()) {
        return {
            address: cs.readAddress(),
            storageStat: parseStorageInfo(cs),
            storage: parseAccountStorage(cs)
        }
    } else {
        return null;
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L384
// shard_ident$00 shard_pfx_bits:(#<= 60) 
//  workchain_id:int32 shard_prefix:uint64 = ShardIdent;
export type RawShardIdent = {
    shardPrefixBits: number,
    workchainId: number,
    shardPrefix: BN
}
export function parseShardIdent(cs: Slice) {
    if (cs.readUintNumber(2) !== 0) {
        throw Error('Invalid data')
    }
    let shardPrefixBits = cs.readUintNumber(6);
    let workchainId = cs.readIntNumber(32);
    let shardPrefix = cs.readUint(64);
    return {
        shardPrefixBits,
        workchainId,
        shardPrefix
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L256
// account_descr$_ account:^Account last_trans_hash:bits256 
//  last_trans_lt:uint64 = ShardAccount;
export type RawShardAccount = {
    address: Address | null;
    lastTransHash: Buffer;
    lastTransLt: BN;
};
export function parseShardAccount(cs: Slice): RawShardAccount {
    let accountCell = cs.readCell();
    let address: Address | null = null;
    if (!accountCell.isExotic) {
        address = accountCell.beginParse().readAddress();
    }
    return {
        address,
        lastTransHash: cs.readBuffer(32),
        lastTransLt: cs.readUint(64)
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L259
// depth_balance$_ split_depth:(#<= 30) balance:CurrencyCollection = DepthBalanceInfo;
export type RawDepthBalanceInfo = {
    splitDepth: number,
    balance: RawCurrencyCollection
}
export function parseDepthBalanceInfo(cs: Slice): RawDepthBalanceInfo {
    return {
        splitDepth: cs.readUintNumber(5),
        balance: parseCurrencyCollection(cs)
    }
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L261
// _ (HashmapAugE 256 ShardAccount DepthBalanceInfo) = ShardAccounts;
export type RawShardAccountRef = {
    shardAccount: RawShardAccount
    depthBalanceInfo: RawDepthBalanceInfo
};
export function parseShardAccounts(cs: Slice): Map<string, RawShardAccountRef> {
    if (!cs.readBit()) {
        return new Map();
    }
    return parseDict(cs.readRef(), 256, (cs2) => {
        let depthBalanceInfo = parseDepthBalanceInfo(cs2);
        let shardAccount = parseShardAccount(cs2);
        return {
            depthBalanceInfo,
            shardAccount
        }
    });
}

// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/block.tlb#L509
// _ config_addr:bits256 config:^(Hashmap 32 ^Cell) 
//  = ConfigParams;
// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/block.tlb#L534
// masterchain_state_extra#cc26
//  shard_hashes:ShardHashes
//  config:ConfigParams
//  ^[ flags:(## 16) { flags <= 1 }
//     validator_info:ValidatorInfo
//     prev_blocks:OldMcBlocksInfo
//     after_key_block:Bool
//     last_key_block:(Maybe ExtBlkRef)
//     block_create_stats:(flags . 0)?BlockCreateStats ]
//  global_balance:CurrencyCollection
// = McStateExtra;
export type RawMasterChainStateExtra = {
    configAddress: Address;
    config: Cell;
    globalBalance: RawCurrencyCollection
};
export function parseMasterchainStateExtra(cs: Slice): RawMasterChainStateExtra {

    // Check magic
    if (cs.readUintNumber(16) !== 0xcc26) {
        throw Error('Invalid data');
    }

    // Skip shard_hashes
    if (cs.readBit()) {
        cs.readCell();
    }

    // Read config
    let configAddress = new Address(-1, cs.readBuffer(32));
    let config = cs.readCell();

    // Rad global balance
    const globalBalance = parseCurrencyCollection(cs);

    return {
        config,
        configAddress,
        globalBalance
    };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L396
// shard_state#9023afe2 global_id:int32
//  shard_id:ShardIdent 
//  seq_no:uint32 vert_seq_no:#
//  gen_utime:uint32 gen_lt:uint64
//  min_ref_mc_seqno:uint32
//  out_msg_queue_info:^OutMsgQueueInfo
//  before_split:(## 1)
//  accounts:^ShardAccounts
//  ^[ overload_history:uint64 underload_history:uint64
//  total_balance:CurrencyCollection
//  total_validator_fees:CurrencyCollection
//  libraries:(HashmapE 256 LibDescr)
//  master_ref:(Maybe BlkMasterInfo) ]
//  custom:(Maybe ^McStateExtra)
//  = ShardStateUnsplit;
export type RawShardStateUnsplit = {
    globalId: number,
    shardId: RawShardIdent,
    seqno: number,
    vertSeqNo: number,
    genUtime: number,
    genLt: BN,
    minRefSeqno: number,
    beforeSplit: boolean,
    accounts: Map<string, RawShardAccountRef>,
    extras: RawMasterChainStateExtra | null
}
export function parseShardStateUnsplit(cs: Slice): RawShardStateUnsplit {
    if (cs.readUintNumber(32) !== 0x9023afe2) {
        throw Error('Invalid data');
    }
    let globalId = cs.readIntNumber(32);
    let shardId = parseShardIdent(cs);
    let seqno = cs.readUintNumber(32);
    let vertSeqNo = cs.readUintNumber(32);
    let genUtime = cs.readUintNumber(32);
    let genLt = cs.readUint(64);
    let minRefSeqno = cs.readUintNumber(32);

    // Skip OutMsgQueueInfo: usually exotic
    cs.readCell();

    let beforeSplit = cs.readBit();

    // Parse accounts
    let accounts: Map<string, RawShardAccountRef>;
    let accountsCell = cs.readCell();
    if (accountsCell.isExotic) {
        accounts = new Map();
    } else {
        accounts = parseShardAccounts(accountsCell.beginParse());
    }

    // Skip (not used by apps)
    cs.readCell();

    // Parse extras
    let mcStateExtra = cs.readBit();
    let extras: RawMasterChainStateExtra | null = null;
    if (mcStateExtra) {
        let cell = cs.readCell();
        if (!cell.isExotic) {
            extras = parseMasterchainStateExtra(cell.beginParse());
        }
    };

    return {
        globalId,
        shardId,
        seqno,
        vertSeqNo,
        genUtime,
        genLt,
        minRefSeqno,
        beforeSplit,
        accounts,
        extras
    }
}