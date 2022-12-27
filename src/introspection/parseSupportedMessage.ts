import { Address, beginCell, Cell, Slice } from "ton-core";
import { crc32str } from "../utils/crc32";
import { KnownInterface } from "./getSupportedInterfaces";

export type SupportedMessage = { type: string, data: { [key: string]: bigint | string | number | boolean | Buffer | Cell | Address | null } };

function parseNominatorsMessage(op: number, sc: Slice): SupportedMessage | null {
    // Deposit
    if (op === crc32str('op::stake_deposit')) {
        let queryId = sc.loadUintBig(64);
        let gasLimit = sc.loadCoins();
        return {
            type: 'deposit',
            data: {
                'query_id': queryId,
                'gas_limit': gasLimit
            }
        };
    }
    if (op === crc32str('op::stake_deposit::response')) {
        return {
            type: 'deposit::ok',
            data: {}
        };
    }

    // Withdraw
    if (op === crc32str('op::stake_withdraw')) {
        let queryId = sc.loadUintBig(64);
        let gasLimit = sc.loadCoins();
        let stake = sc.loadCoins();
        return {
            type: 'withdraw',
            data: {
                'stake': stake,
                'query_id': queryId,
                'gas_limit': gasLimit
            }
        };
    }
    if (op === crc32str('op::stake_withdraw::delayed')) {
        return {
            type: 'withdraw::delayed',
            data: {}
        };
    }
    if (op === crc32str('op::stake_withdraw::response')) {
        return {
            type: 'withdraw::ok',
            data: {}
        };
    }

    // Upgrade
    if (op === crc32str('op::upgrade')) {
        let queryId = sc.loadUintBig(64);
        let gasLimit = sc.loadCoins();
        let code = sc.loadRef();
        return {
            type: 'upgrade',
            data: {
                'code': code,
                'query_id': queryId,
                'gas_limit': gasLimit
            }
        };
    }
    if (op === crc32str('op::upgrade::response')) {
        return {
            type: 'upgrade::ok',
            data: {}
        };
    }

    // Upgrade
    if (op === crc32str('op::upgrade')) {
        let queryId = sc.loadUintBig(64);
        let gasLimit = sc.loadCoins();
        let code = sc.loadRef();
        return {
            type: 'upgrade',
            data: {
                'code': code,
                'query_id': queryId,
                'gas_limit': gasLimit
            }
        };
    }
    if (op === crc32str('op::upgrade::ok')) {
        return {
            type: 'upgrade::ok',
            data: {}
        };
    }

    // Update
    if (op === crc32str('op::update')) {
        let queryId = sc.loadUintBig(64);
        let gasLimit = sc.loadCoins();
        let params = sc.loadRef();
        return {
            type: 'update',
            data: {
                'code': params,
                'query_id': queryId,
                'gas_limit': gasLimit
            }
        };
    }
    if (op === crc32str('op::update::ok')) {
        return {
            type: 'update::ok',
            data: {}
        };
    }

    return null;
}

function parseJettonWallet(op: number, sc: Slice): SupportedMessage | null {

    // excesses#d53276db query_id:uint64 = InternalMsgBody;
    if (op === 0xd53276db) {
        let queryId = sc.loadUintBig(64);
        return {
            type: 'jetton::excesses',
            data: {
                'query_id': queryId
            }
        };
    }

    // transfer#f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
    //              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
    //              forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
    //              = InternalMsgBody;
    if (op === 0xf8a7ea5) {
        let queryId = sc.loadUintBig(64);
        let amount = sc.loadCoins();
        let destination = sc.loadMaybeAddress();
        let responseDestination = sc.loadMaybeAddress();
        let customPayload = sc.loadMaybeRef();
        let forwardTonAmount = sc.loadCoins();
        let forwardPayload = sc.loadBit() ? sc.loadRef() : beginCell().storeSlice(sc).endCell();
        return {
            type: 'jetton::transfer',
            data: {
                'query_id': queryId,
                'amount': amount,
                'destination': destination,
                'response_destination': responseDestination,
                'custom_payload': customPayload,
                'forward_ton': forwardTonAmount,
                'payload': forwardPayload
            }
        };
    }

    // transfer_notification#7362d09c query_id:uint64 amount:(VarUInteger 16)
    //        sender:MsgAddress forward_payload:(Either Cell ^Cell)
    //        = InternalMsgBody;
    if (op === 0x7362d09c) {
        let queryId = sc.loadUintBig(64);
        let amount = sc.loadCoins();
        let sender = sc.loadMaybeAddress();
        let forwardPayload = sc.loadBit() ? sc.loadRef() : beginCell().storeSlice(sc).endCell();
        return {
            type: 'jetton::transfer_notification',
            data: {
                'query_id': queryId,
                'amount': amount,
                'sender': sender,
                'payload': forwardPayload
            }
        };
    }

    return null;
}

function parseJettonMaster(op: number, sc: Slice): SupportedMessage | null {
    return null;
}

export function parseSupportedMessage(knownInteface: KnownInterface, message: Cell): SupportedMessage | null {
    try {

        // Load OP
        let sc = message.beginParse();
        if (sc.remainingBits < 32) {
            return null;
        }
        let op = sc.loadUint(32);
        if (op === 0) {
            return null;
        }

        // Nominators parsing
        if (knownInteface === 'com.tonwhales.nominators:v0') {
            return parseNominatorsMessage(op, sc);
        }

        // Jettons
        if (knownInteface === 'org.ton.jetton.wallet.v1') {
            return parseJettonWallet(op, sc);
        }
        if (knownInteface === 'org.ton.jetton.master.v1') {
            return parseJettonMaster(op, sc);
        }

    } catch (e) {
        console.warn(e);
    }
    return null;
}