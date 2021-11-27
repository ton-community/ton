import BN from "bn.js";
import { Address, Slice } from "..";


// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L243
// acc_state_uninit$00 = AccountStatus;
// acc_state_frozen$01 = AccountStatus;
// acc_state_active$10 = AccountStatus;
// acc_state_nonexist$11 = AccountStatus;
function readAccountStatus(slice: Slice) {
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
}

export type RawAccountStatus = ReturnType<typeof readAccountStatus>;

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L120
// extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32)) 
//  = ExtraCurrencyCollection;
//  currencies$_ grams:Grams other:ExtraCurrencyCollection 
//            = CurrencyCollection;
function readCurrencyCollection(slice: Slice) {
    const coins = slice.readCoins();
    if (slice.readBit()) {
        throw Error('Currency collctions are not supported yet');
    }
    return { coins };
}
export type RawCurrencyCollection = ReturnType<typeof readCurrencyCollection>;

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L123
// int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
//  src:MsgAddressInt dest:MsgAddressInt 
//  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
//  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
// ext_in_msg_info$10 src:MsgAddressExt dest:MsgAddressInt 
//  import_fee:Grams = CommonMsgInfo;
// ext_out_msg_info$11 src:MsgAddressInt dest:MsgAddressExt
//  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
function readCommonMsgInfo(slice: Slice) {

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
        // In external
        let src = slice.readAddress();
        let dest = slice.readAddress();
        let createdLt = slice.readUint(64);
        let createdAt = slice.readUintNumber(32);
        return {
            type: 'external-in',
            src,
            dest,
            createdLt,
            createdAt
        }
    } else {
        // Out external
        let src = slice.readAddress();
        let dest = slice.readAddress();
        let importFee = slice.readCoins()
        return {
            type: 'external-out',
            src,
            dest,
            importFee
        }
    }
}
export type RawCommonMessageInfo = ReturnType<typeof readCommonMsgInfo>;

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L141
// _ split_depth:(Maybe (## 5)) special:(Maybe TickTock)
//  code:(Maybe ^Cell) data:(Maybe ^Cell)
//  library:(HashmapE 256 SimpleLib) = StateInit;
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
export type RawStateInit = ReturnType<typeof readStateInit>;

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L147
// message$_ {X:Type} info:CommonMsgInfo
//  init:(Maybe (Either StateInit ^StateInit))
//  body:(Either X ^X) = Message X;
function readMessage(slice: Slice) {
    const info = readCommonMsgInfo(slice);
    const hasInit = slice.readBit();
    let stateInit: RawStateInit | null = null;
    if (hasInit) {
        if (!slice.readBit()) {
            stateInit = readStateInit(slice);
        } else {
            stateInit = readStateInit(slice.readRef());
        }
    }
    const body = slice.readBit() ? slice.readRef().clone() : slice.clone();

    return {
        info,
        stateInit,
        body
    };
}
export type RawMessage = ReturnType<typeof readMessage>;

// Source: https://github.com/ton-blockchain/ton/blob/24dc184a2ea67f9c47042b4104bbb4d82289fac1/crypto/block/block.tlb#L273
// update_hashes#72 {X:Type} old_hash:bits256 new_hash:bits256
//  = HASH_UPDATE X;
function readHashUpdate(slice: Slice) {
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
function readAccountChange(slice: Slice) {
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
function readStorageUsedShort(slice: Slice) {
    return {
        cells: slice.readVarUIntNumber(3),
        bits: slice.readVarUIntNumber(3)
    }
}

// tr_phase_storage$_ storage_fees_collected:Grams 
//   storage_fees_due:(Maybe Grams)
//   status_change:AccStatusChange
//   = TrStoragePhase;
function readStoragePhase(slice: Slice) {
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
type StoragePhase = ReturnType<typeof readStoragePhase>;

// tr_phase_credit$_ due_fees_collected:(Maybe Grams)
//   credit:CurrencyCollection = TrCreditPhase;
function readCreditPhase(slice: Slice) {
    let dueFeesColelcted = slice.readBit() ? slice.readCoins() : null;
    const credit = readCurrencyCollection(slice);
    return {
        dueFeesColelcted,
        credit
    }
}
type CreditPhase = ReturnType<typeof readCreditPhase>;


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

function readComputePhase(slice: Slice) {
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

type ComputePhase = ReturnType<typeof readComputePhase>;

// tr_phase_action$_ success:Bool valid:Bool no_funds:Bool
//   status_change:AccStatusChange
//   total_fwd_fees:(Maybe Grams) total_action_fees:(Maybe Grams)
//   result_code:int32 result_arg:(Maybe int32) tot_actions:uint16
//   spec_actions:uint16 skipped_actions:uint16 msgs_created:uint16 
//   action_list_hash:bits256 tot_msg_size:StorageUsedShort 
//   = TrActionPhase;

function readActionPhase(slice: Slice) {
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

type ActionPhase = ReturnType<typeof readActionPhase>;

// tr_phase_bounce_negfunds$00 = TrBouncePhase;
// tr_phase_bounce_nofunds$01 msg_size:StorageUsedShort req_fwd_fees:Grams = TrBouncePhase;
// tr_phase_bounce_ok$1 msg_size:StorageUsedShort msg_fees:Grams fwd_fees:Grams = TrBouncePhase;
function readBouncePhase(slice: Slice) {

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

type BouncePhase = ReturnType<typeof readBouncePhase>;

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

function readTransactionDescription(slice: Slice) {
    const type = slice.readUintNumber(4);
    if (type === 0x00) {
        const creditFirst = slice.readBit();
        let storagePhase: StoragePhase | null = null;
        let creditPhase: CreditPhase | null = null;
        if (slice.readBit()) {
            storagePhase = readStoragePhase(slice);
        }
        if (slice.readBit()) {
            creditPhase = readCreditPhase(slice);
        }
        let computePhase: ComputePhase = readComputePhase(slice);
        let actionPhase: ActionPhase | null = null;
        if (slice.readBit()) {
            actionPhase = readActionPhase(slice.readRef());
        }
        let aborted = slice.readBit();
        let bouncePhase: BouncePhase | null = null;
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
        let storagePhase: StoragePhase = readStoragePhase(slice);
        return {
            type: 'storage',
            storagePhase
        }
    }
    if (type === 0x2 || type === 0x03) {
        const isTock = type === 0x03;
        let storagePhase: StoragePhase = readStoragePhase(slice);
        let computePhase: ComputePhase = readComputePhase(slice);
        let actionPhase: ActionPhase | null = null;
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
export function parseTransaction(workchain: number, slice: Slice) {
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
    let outMessages: Map<string, RawMessage> = new Map();
    if (hasOutMessages) {
        outMessages = messages.readDict(15, (slice) => readMessage(slice.readRef()));
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