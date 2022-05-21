import BN from 'bn.js';
import { Cell } from '../boc/Cell';
import { MsgPrices, StoragePrices } from '../contracts/configs/configParsing';
import { parseMessage } from './parse';

//
// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/transaction.cpp#L425
//

export function computeStorageFees(data: {
    now: number
    lastPaid: number
    storagePrices: StoragePrices[]
    storageStat: { cells: number, bits: number, publicCells: number }
    special: boolean
    masterchain: boolean
}) {
    const {
        lastPaid,
        now,
        storagePrices,
        storageStat,
        special,
        masterchain
    } = data;
    if (now <= lastPaid || storagePrices.length === 0 || now < storagePrices[0].utime_since.toNumber() || special) {
        return new BN(0);
    }
    let upto = Math.max(lastPaid, storagePrices[0].utime_since.toNumber());
    let total = new BN(0);
    for (let i = 0; i < storagePrices.length && upto < now; i++) {
        let valid_until = (i < storagePrices.length - 1 ? Math.min(now, storagePrices[i + 1].utime_since.toNumber()) : now);
        let payment = new BN(0);
        if (upto < valid_until) {
            let delta = valid_until - upto;
            payment = payment.add(new BN(storageStat.cells).mul(masterchain ? storagePrices[i].mc_cell_price_ps : storagePrices[i].cell_price_ps));
            payment = payment.add(new BN(storageStat.bits).mul(masterchain ? storagePrices[i].mc_bit_price_ps : storagePrices[i].bit_price_ps));
            payment = payment.mul(new BN(delta));
        }
        upto = valid_until;
        total = total.add(payment);
    }

    return shr16ceil(total);
}

//
// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/transaction.cpp#L1218
//

export function computeFwdFees(msgPrices: MsgPrices, cells: BN, bits: BN) {
    return msgPrices.lumpPrice.add(shr16ceil(msgPrices.bitPrice.mul(bits)
        .add(msgPrices.cellPrice.mul(cells)))
    );
}

//
// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/transaction.cpp#L761
//

export function computeGasPrices(gasUsed: BN, prices: { flatLimit: BN, flatPrice: BN, price: BN }) {
    if (gasUsed.lte(prices.flatLimit)) {
        return prices.flatPrice;
    } else {
        //  td::rshift(gas_price256 * (gas_used - cfg.flat_gas_limit), 16, 1) + cfg.flat_gas_price
        return prices.flatPrice.add(prices.price.mul(gasUsed.sub(prices.flatLimit)).shrn(16));
    }
}

//
// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/transaction.cpp#L530
//

export function computeExternalMessageFees(msgPrices: MsgPrices, cell: Cell) {

    // Collect stats
    let storageStats = collectCellStats(cell);
    storageStats.bits -= cell.bits.cursor;
    storageStats.cells -= 1;

    return computeFwdFees(msgPrices, new BN(storageStats.cells), new BN(storageStats.bits));
}

export function computeInternalMessageFees(msgPrices: MsgPrices, cell: Cell) {
    let msg = parseMessage(cell.beginParse());
    let storageStats: { bits: number, cells: number } = { bits: 0, cells: 0 };

    if (msg.info.type === 'internal') {

    } else if (msg.info.type === 'external-out') {

    } else {
        throw Error('Invalid message');
    }

    let fees = computeFwdFees(msgPrices, new BN(storageStats.cells), new BN(storageStats.bits));
    return fees.mul(msgPrices.firstFrac).shrn(16);
    // vm::CellStorageStat sstat;  // for message size
    // // preliminary storage estimation of the resulting message
    // sstat.add_used_storage(msg.init, true, 3);  // message init
    // sstat.add_used_storage(msg.body, true, 3);  // message body (the root cell itself is not counted)
    // if (!ext_msg) {
    //   sstat.add_used_storage(info.value->prefetch_ref());
    // }
}

function collectCellStats(cell: Cell): { bits: number, cells: number } {
    let bits = cell.bits.cursor;
    let cells = 1;
    for (let ref of cell.refs) {
        let r = collectCellStats(ref);
        cells += r.cells;
        bits += r.bits;
    }
    return { bits, cells };
}

function shr16ceil(src: BN) {
    let rem = src.mod(new BN(65536));
    let res = src.shrn(16);
    if (!rem.eqn(0)) {
        res = res.addn(1);
    }
    return res;
}