import BN from 'bn.js';
import { GasLimitsPrices, MsgPrices, StoragePrices } from '../contracts/configs/configParsing';

//
// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/transaction.cpp#L425
//

export function computeStorageFees(data: {
    now: number
    lastPaid: number
    storagePrices: StoragePrices[]
    storageStat: { cells: BN, bits: BN, publicCells: BN }
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
            payment = payment.add(storageStat.cells.mul(masterchain ? storagePrices[i].mc_cell_price_ps : storagePrices[i].mc_cell_price_ps));
            payment = payment.add(storageStat.bits.mul(masterchain ? storagePrices[i].mc_bit_price_ps : storagePrices[i].bit_price_ps));
            payment = payment.mul(new BN(delta));
        }
        upto = valid_until;
        total = total.add(payment);
    }
    
    return total.shrn(16);
}

export function computeFwdFees(msgPrices: MsgPrices, cells: BN, bits: BN) {
    return msgPrices.lumpPrice.add(
        msgPrices.bitPrice.mul(bits)
            .add(msgPrices.cellPrice.mul(cells))
            .add(new BN(0xffff))
            .shrn(16)
    );
}

export function computeGasPrices(gasUsed: BN, gasLimitsPrices: GasLimitsPrices) {
    if (gasUsed.lte(gasLimitsPrices.flatLimit)) {
        return gasLimitsPrices.flatGasPrice;
    } else {
        //  td::rshift(gas_price256 * (gas_used - cfg.flat_gas_limit), 16, 1) + cfg.flat_gas_price
        return gasLimitsPrices.flatGasPrice.add(gasLimitsPrices.other.gasPrice.mul(gasUsed.sub(gasLimitsPrices.flatLimit)).shrn(16))
    }
}