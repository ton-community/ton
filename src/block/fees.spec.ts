import BN from 'bn.js'
import { Address } from '../address/Address';
import { Cell } from '../boc/Cell';
import { parseDictRefs } from '../boc/dict/parseDict';
import { TonClient } from '../client/TonClient';
import { TonClient4 } from '../client/TonClient4';
import { configParse18 } from '../contracts/configs/configParsing';
import { CellMessage } from '../messages/CellMessage';
import { CommentMessage } from '../messages/CommentMessage';
import { CommonMessageInfo } from '../messages/CommonMessageInfo';
import { ExternalMessage } from '../messages/ExternalMessage';
import { InternalMessage } from '../messages/InternalMessage';
import { fromNano, toNano } from '../utils/convert';
import { computeFwdFees, computeGasPrices, computeStorageFees } from './fees'

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });
const toncenter = new TonClient({ endpoint: 'https://mainnet.tonhubapi.com' })

describe('fees', () => {

    it('should match storage results from toncenter on real contract', async () => {

        const seqno = 20713508;
        const now = 1653114703;

        //
        // Fetch config
        //

        const config = await client.getConfig(seqno);
        const dict = parseDictRefs(Cell.fromBoc(Buffer.from(config.config.cell, 'base64'))[0].beginParse(), 32);
        console.warn(dict.get('18')!.toCell().toString());
        const storagePrices = configParse18(dict.get('18'));
        for (let p of storagePrices) {
            console.warn({
                utime_since: p.utime_since.toString(10),
                bit_price_ps: p.bit_price_ps.toString(10),
                cell_price_ps: p.cell_price_ps.toString(10),
                mc_bit_price_ps: p.mc_bit_price_ps.toString(10),
                mc_cell_price_ps: p.mc_cell_price_ps.toString(10),
            });
        }
        console.warn(storagePrices);

        //
        // Fetch profile
        //

        const profile = await client.getAccount(seqno, Address.parse('EQCG-Bk-L7iZmytzTwPTCJCgBL6xg89LTwfu1dEjOka06cLB'));
        const storageStat = profile.account.storageStat!;

        //
        // Calculate fees
        //
        console.warn(now);
        console.warn(now - storageStat.lastPaid);
        console.warn(storagePrices[0].utime_since.toNumber());
        let fees = computeStorageFees({
            lastPaid: storageStat.lastPaid,
            masterchain: false,
            now: now,
            special: false,
            storagePrices,
            storageStat: {
                bits: new BN(storageStat.used.bits),
                cells: new BN(storageStat.used.cells),
                publicCells: new BN(storageStat.used.publicCells)
            }
        });

        // Fee
        let resultFee = fromNano(fees);
        console.warn(fees);
        console.warn(resultFee);

        //
        // Order
        // NOTE: Order is real, but gas and storage got from transaction in blockchain: all wallet transactions, data and code is constant.
        // 
        // const order = Cell.fromBoc(Buffer.from('te6cckEBAgEAgwABnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApqaMXYoh6ywAAAB0AAwEAYEIAN41HUUGwFVmaD0EUj2a1j8QJ+MnVT0IRF1clP39BHIiAAAAAAAAAAAAAAAAAAKxFDdU=', 'base64'))[0];
        // const gasUsed = 7715;


        // console.warn(bc);
    });

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