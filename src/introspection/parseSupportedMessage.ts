import BN from "bn.js";
import { Cell } from "../boc/Cell";
import { Slice } from "../boc/Slice";
import { crc32str } from "../utils/crc32";
import { KnownInterface } from "./getSupportedInterfaces";

export type SupportedMessage = { type: string, data: { [key: string]: BN | string | number | boolean | Buffer | Cell } };

function parseNominatorsMessage(op: number, sc: Slice): SupportedMessage | null {
    // Deposit
    if (op === crc32str('op::stake_deposit')) {
        let queryId = sc.readUint(64);
        let gasLimit = sc.readCoins().toNumber();
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
        let queryId = sc.readUint(64);
        let gasLimit = sc.readCoins().toNumber();
        const stake = sc.readCoins();
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
        let queryId = sc.readUint(64);
        let gasLimit = sc.readCoins().toNumber();
        const code = sc.readCell();
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
        let queryId = sc.readUint(64);
        let gasLimit = sc.readCoins().toNumber();
        const code = sc.readCell();
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
        let queryId = sc.readUint(64);
        let gasLimit = sc.readCoins().toNumber();
        const params = sc.readCell();
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

export function parseSupportedMessage(knownInteface: KnownInterface, message: Cell): SupportedMessage | null {
    try {

        // Load OP
        let sc = message.beginParse();
        if (sc.remaining < 32) {
            return null;
        }
        let op = sc.readUintNumber(32);
        if (op === 0) {
            return null;
        }

        // Nominators parsing
        if (knownInteface === 'com.tonwhales.nominators:v0') {
            return parseNominatorsMessage(op, sc);
        }

    } catch (e) {
        console.warn(e);
    }
    return null;
}