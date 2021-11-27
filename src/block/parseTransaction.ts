import BN from "bn.js";
import { Address, Cell, Slice } from "..";


// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L243
// acc_state_uninit$00 = AccountStatus;
// acc_state_frozen$01 = AccountStatus;
// acc_state_active$10 = AccountStatus;
// acc_state_nonexist$11 = AccountStatus;
export type RawAccountStatus = 'uninitialized' | 'frozen' | 'active' | 'non-existing';
function readAccountStatus(slice: Slice): RawAccountStatus {
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
    throw Error('Unreachable');
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L120
// extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32)) 
//  = ExtraCurrencyCollection;
//  currencies$_ grams:Grams other:ExtraCurrencyCollection 
//            = CurrencyCollection;
export type RawCurrencyCollection = { coins: BN };
function readCurrencyCollection(slice: Slice): RawCurrencyCollection {
    const coins = slice.readCoins();
    if (slice.readBit()) {
        throw Error('Currency collctions are not supported yet');
    }
    return { coins };
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
function readCommonMsgInfo(slice: Slice): RawCommonMessageInfo {

    if (!slice.readBit()) {
        // Internal
        let ihrDisabled = slice.readBit();
        let bounce = slice.readBit();
        let bounced = slice.readBit();
        let src = slice.readAddress();
        let dest = slice.readAddress();
        let value = readCurrencyCollection(slice);
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

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L141
// _ split_depth:(Maybe (## 5)) special:(Maybe TickTock)
//  code:(Maybe ^Cell) data:(Maybe ^Cell)
//  library:(HashmapE 256 SimpleLib) = StateInit;
export type RawStateInit = { code: Cell | null, data: Cell | null };
function readStateInit(slice: Slice) {
    if (slice.readBit()) {
        throw Error('Unsupported');
    }
    if (slice.readBit()) {
        throw Error('Unsupported');
    }
    const hasCode = slice.readBit();
    const code = hasCode ? slice.readCell() : null;
    const hasData = slice.readBit();
    const data = hasData ? slice.readCell() : null;
    if (slice.readBit()) {
        throw Error('Unsupported');
    }

    return { data, code };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L147
// message$_ {X:Type} info:CommonMsgInfo
//  init:(Maybe (Either StateInit ^StateInit))
//  body:(Either X ^X) = Message X;
export type RawMessage = {
    info: RawCommonMessageInfo,
    init: RawStateInit | null,
    body: Cell
};
function readMessage(slice: Slice): RawMessage {
    const info = readCommonMsgInfo(slice);
    const hasInit = slice.readBit();
    let init: RawStateInit | null = null;
    if (hasInit) {
        if (!slice.readBit()) {
            init = readStateInit(slice);
        } else {
            init = readStateInit(slice.readRef());
        }
    }
    const body = slice.readBit() ? slice.readRef().toCell() : slice.toCell();

    return {
        info,
        init,
        body
    };
}

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L273
// update_hashes#72 {X:Type} old_hash:bits256 new_hash:bits256
//  = HASH_UPDATE X;
export type RawHashUpdate = { oldHash: Buffer, newHash: Buffer };
function readHashUpdate(slice: Slice): RawHashUpdate {
    if (slice.readUintNumber(8) !== 0x72) {
        throw Error('Invalid transaction');
    }
    const oldHash = slice.readBuffer(32);
    const newHash = slice.readBuffer(32);
    return { oldHash, newHash };
}

// acst_unchanged$0 = AccStatusChange;  // x -> x
// acst_frozen$10 = AccStatusChange;    // init -> frozen
// acst_deleted$11 = AccStatusChange;   // frozen -> deleted
export type RawAccountStatusChange = 'unchanged' | 'frozen' | 'deleted';
function readAccountChange(slice: Slice): RawAccountStatusChange {
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
function readStorageUsedShort(slice: Slice): RawStorageUsedShort {
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
function readStoragePhase(slice: Slice): RawStoragePhase {
    const storageFeesCollected = slice.readCoins();
    let storageFeesDue: BN | null = null;
    if (slice.readBit()) {
        storageFeesDue = slice.readCoins();
    }
    const statusChange = readAccountChange(slice);
    return {
        storageFeesCollected,
        storageFeesDue,
        statusChange
    }
}

// tr_phase_credit$_ due_fees_collected:(Maybe Grams)
//   credit:CurrencyCollection = TrCreditPhase;
export type RawCreditPhase = { dueFeesColelcted: BN | null, credit: RawCurrencyCollection };
function readCreditPhase(slice: Slice): RawCreditPhase {
    let dueFeesColelcted = slice.readBit() ? slice.readCoins() : null;
    const credit = readCurrencyCollection(slice);
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
function readComputePhase(slice: Slice): RawComputePhase {
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
function readActionPhase(slice: Slice): RawActionPhase {
    const success = slice.readBit();
    const valid = slice.readBit();
    const noFunds = slice.readBit();
    const statusChange = readAccountChange(slice);
    const totalFwdFees = slice.readBit() ? slice.readCoins() : null;
    const totalActionFees = slice.readBit() ? slice.readCoins() : null;
    const resultCode = slice.readUintNumber(32); // TODO: Change to int32
    const resultArg = slice.readBit() ? slice.readUintNumber(32) : null; // TODO: Change to int32
    const totalActions = slice.readUintNumber(16);
    const specialActions = slice.readUintNumber(16);
    const skippedActions = slice.readUintNumber(16);
    const messagesCreated = slice.readUintNumber(16);
    const actionListHash = slice.readBuffer(32);
    const totalMessageSizes = readStorageUsedShort(slice);

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
function readBouncePhase(slice: Slice): RawBouncePhase {

    // Is OK
    if (slice.readBit()) {
        const msgSize = readStorageUsedShort(slice);
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
        const msgSize = readStorageUsedShort(slice);
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
function readTransactionDescription(slice: Slice): RawTransactionDescription {
    const type = slice.readUintNumber(4);
    if (type === 0x00) {
        const creditFirst = slice.readBit();
        let storagePhase: RawStoragePhase | null = null;
        let creditPhase: RawCreditPhase | null = null;
        if (slice.readBit()) {
            storagePhase = readStoragePhase(slice);
        }
        if (slice.readBit()) {
            creditPhase = readCreditPhase(slice);
        }
        let computePhase: RawComputePhase = readComputePhase(slice);
        let actionPhase: RawActionPhase | null = null;
        if (slice.readBit()) {
            actionPhase = readActionPhase(slice.readRef());
        }
        let aborted = slice.readBit();
        let bouncePhase: RawBouncePhase | null = null;
        if (slice.readBit()) {
            bouncePhase = readBouncePhase(slice);
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
        let storagePhase: RawStoragePhase = readStoragePhase(slice);
        return {
            type: 'storage',
            storagePhase
        }
    }
    if (type === 0x2 || type === 0x03) {
        const isTock = type === 0x03;
        let storagePhase: RawStoragePhase = readStoragePhase(slice);
        let computePhase: RawComputePhase = readComputePhase(slice);
        let actionPhase: RawActionPhase | null = null;
        if (slice.readBit()) {
            actionPhase = readActionPhase(slice.readRef());
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
        throw Error('Invalid transaction');
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
    const oldStatus = readAccountStatus(slice);
    const newStatus = readAccountStatus(slice);

    // Messages ref
    const messages = slice.readRef();
    let hasInMessage = messages.readBit();
    let hasOutMessages = messages.readBit();
    let inMessage: RawMessage | null = null;
    if (hasInMessage) {
        inMessage = readMessage(messages.readRef());
    }
    let outMessages: RawMessage[] = [];
    if (hasOutMessages) {
        let dict = messages.readDict(15, (slice) => readMessage(slice.readRef()));
        for (let msg of Array.from(dict.values())) {
            outMessages.push(msg);
        }
    }

    // Currency collections
    let fees = readCurrencyCollection(slice);

    // Hash update
    let update = readHashUpdate(slice.readRef());

    // Description
    let description = readTransactionDescription(slice.readRef());

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