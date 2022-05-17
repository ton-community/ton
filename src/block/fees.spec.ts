import BN from 'bn.js'
import { computeFwdFees, computeGasPrices, computeStorageFees } from './fees'

describe('fees', () => {
    it('should compute storage fees', () => {
        let fees = computeStorageFees({
            lastPaid: 0,
            masterchain: false,
            now: 1,
            special: false,
            storagePrices: [{ 
                bit_price_ps: new BN(2), 
                cell_price_ps: new BN(1), 
                mc_bit_price_ps: new BN(1), 
                mc_cell_price_ps: new BN(1), 
                utime_since: new BN(0)
             }],
             storageStat: { bits: new BN(10), cells: new BN(1), publicCells: new BN(1) }
        });

        expect(fees.eq(new BN(0x15))).toBe(true);
    });

    it('should compute fwd fees', () => {
        let fees = computeFwdFees({
            bitPrice: new BN(1),
            lumpPrice: new BN(10),
            cellPrice: new BN(2),
            firstFrac: new BN(1),
            nextFrac: new BN(1),
            ihrPriceFactor: new BN(1)
        }, new BN(1), new BN(10));

        expect(fees.eq(new BN(0xb))).toBe(true);
    });

    it('should compute gas prices', () => {
        let fees = computeGasPrices(new BN(1000), {
            flatGasPrice: new BN(10),
            flatLimit: new BN(1000),
            other: {
                gasCredit: new BN(10),
                blockGasLimit: new BN(10),
                deleteDueLimit: new BN(10),
                freezeDueLimit: new BN(10),
                gasLimit: new BN(10),
                gasPrice: new BN(10),
                specialGasLimit: new BN(10)
            }
        });

        expect(fees.eq(new BN(0xa))).toBe(true);
    });
})