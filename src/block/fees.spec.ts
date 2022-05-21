import BN from 'bn.js'
import { Address } from '../address/Address';
import { Cell } from '../boc/Cell';
import { parseDictRefs } from '../boc/dict/parseDict';
import { TonClient4 } from '../client/TonClient4';
import { configParse18, configParseGasLimitsPrices, configParseMsgPrices } from '../contracts/configs/configParsing';
import { fromNano, toNano } from '../utils/convert';
import { computeExternalMessageFees, computeFwdFees, computeGasPrices, computeMessageForwardFees, computeStorageFees } from './fees'
import { parseTransaction } from './parse';

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('fees', () => {

    it('should match storage results from toncenter on real contract', async () => {

        const seqno = 20713508;
        const now = 1653114703;

        //
        // Fetch config
        //

        const config = await client.getConfig(seqno);
        const dict = parseDictRefs(Cell.fromBoc(Buffer.from(config.config.cell, 'base64'))[0].beginParse(), 32);
        const storagePrices = configParse18(dict.get('18'));

        //
        // Fetch profile
        //

        const profile = await client.getAccount(seqno, Address.parse('EQCG-Bk-L7iZmytzTwPTCJCgBL6xg89LTwfu1dEjOka06cLB'));
        const storageStat = profile.account.storageStat!;

        //
        // Calculate fees
        //
        let fees = computeStorageFees({
            lastPaid: storageStat.lastPaid,
            masterchain: false,
            now: now,
            special: false,
            storagePrices,
            storageStat: {
                bits: storageStat.used.bits,
                cells: storageStat.used.cells,
                publicCells: storageStat.used.publicCells
            }
        });

        // Fee
        let resultFee = fromNano(fees);
        expect(resultFee).toMatch('0.000000147');

    });

    it('should compute external message in forward fee', async () => {

        //
        // Params
        //

        const seqno = 20713508;
        const order = Cell.fromBoc(Buffer.from('te6cckEBAgEAgwABnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApqaMXYoh6ywAAAB0AAwEAYEIAN41HUUGwFVmaD0EUj2a1j8QJ+MnVT0IRF1clP39BHIiAAAAAAAAAAAAAAAAAAKxFDdU=', 'base64'))[0];

        //
        // Fetch config
        //

        const config = await client.getConfig(seqno);
        const dict = parseDictRefs(Cell.fromBoc(Buffer.from(config.config.cell, 'base64'))[0].beginParse(), 32);
        const msgPrices = configParseMsgPrices(dict.get('25')); // Workchain

        //
        // External message fees
        //

        const fees = computeExternalMessageFees(msgPrices, order);
        let resultFee = fromNano(fees);
        expect(resultFee).toEqual('0.001484');
    });

    it('should match toncenter transactions', async () => {

        // Example transaction
        // https://tonwhales.com/explorer/address/EQChB6mHV_t4zwS6av_c4Nbx66HVi-fEsAAa_UOnN5RxIoif/28067508000001_edfdd1a45e64d45bb1ded64326f4093ac781f8eef1aa68b24f9ba9ae9c5307f1
        // https://explorer.toncoin.org/transaction?account=EQChB6mHV_t4zwS6av_c4Nbx66HVi-fEsAAa_UOnN5RxIoif&lt=28067508000001&hash=EDFDD1A45E64D45BB1DED64326F4093AC781F8EEF1AA68B24F9BA9AE9C5307F1
        // Receiving transaction: https://tonwhales.com/explorer/address/EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales/28067508000003_40ea176ca034aee63565b99fd5c73c78f422ad9cc8e94e9351612d4401ac4388
        let seqno = 20694322;
        let now = 1653046307;
        const tx = parseTransaction(
            0,
            Cell.fromBoc(
                Buffer.from('te6cckECCgEAAmcAA7V6EHqYdX+3jPBLpq/9zg1vHrodWL58SwABr9Q6c3lHEiAAAZhvnYFQF9ciNMI681VUGDlKl62syyPpYmGWZ0tTRxztAgD+5r8AAAGYb5MDxBYod8IwADRqEscoAQIDAgHgBAUAgnLRHCyALEmqBzudZHUQ/yMpw6n16sISv54IItmIvtROOoY+RVn1e45PUVXw/sn8fEvT9igabAFDyL/HXHcmdpuaAg8MQkYZk88EQAgJAeGIAUIPUw6v9vGeCXTV/7nBrePXQ6sXz4lgADX6h05vKOJEAPFTkWAw7D8SoOHTfx98m2UGdM755D5V/H0ohMTP46kYhvbPq9YomxrhIMzhTwnfMmmCl4GC8Ep7iBehdG6kGHFNTRi7FDvi6AAAK8AAHAYBAd8HAIdiAFIjq4NNPYJxybwVpRafLyJPjOi1JMNU8Sobc1y/ItC1IdzWUAAAAAAAAAAAAAAAAAAAJR1qmAAAAYDhPOHQMBhqCADPaAFCD1MOr/bxngl01f+5wa3j10OrF8+JYAA1+odObyjiRQApEdXBpp7BOOTeCtKLT5eRJ8Z0WpJhqniVDbmuX5FoWpDuaygABhRYYAAAMw3zsCoExQ74RhKOtUwAAADAcJ5w6BgMNQQAnUGdgxOIAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAb8mHoSBMFFhAAAAAAAACAAAAAAACnmOUFlyMIVHNAnHEJbHSXl0I2vUFwmeuUSqpo/Tdbp5AUBns8EOgXQ==', 'base64')
            )[0].beginParse()
        );
        // const msg = Cell.fromBoc(Buffer.from('te6cckEBAgEAhwABnNf9xWcAkyBRDsaxW6WKay54a+1/l/dnVGANK6ysjunZpKGyTnqVywShc838Gb65ApX4dgGpqgccJaE8hr6EjQ8pqaMXYdrdPwAAAAEAAwEAaGIANqppHfyON5Ki6vkICIXM/mMEYjbhJaDsHQ7fv7dbjdqgL68IAAAAAAAAAAAAAAAAAAAUQ7VD', 'base64'))[0];
        // console.warn(tx);


        //
        // Fetch config
        //

        const config = await client.getConfig(seqno);
        const dict = parseDictRefs(Cell.fromBoc(Buffer.from(config.config.cell, 'base64'))[0].beginParse(), 32);
        const storagePrices = configParse18(dict.get('18'));
        const msgPrices = configParseMsgPrices(dict.get('25')); // Workchain
        const gasPrices = configParseGasLimitsPrices(dict.get('21')); // Workchain

        //
        // Fetch account state
        //

        const profile = await client.getAccount(seqno, Address.parse('EQChB6mHV_t4zwS6av_c4Nbx66HVi-fEsAAa_UOnN5RxIoif'));
        const storageStat = profile.account.storageStat!;

        //
        // Calculate storage fee
        //

        let storageFees = computeStorageFees({
            lastPaid: storageStat.lastPaid,
            masterchain: false,
            now: now,
            special: false,
            storagePrices,
            storageStat: {
                bits: storageStat.used.bits,
                cells: storageStat.used.cells,
                publicCells: storageStat.used.publicCells
            }
        });

        expect(fromNano(storageFees)).toEqual('0.000000009');

        //
        // Import fees
        //

        let importFees = computeExternalMessageFees(msgPrices, tx.inMessage!.raw);
        expect(fromNano(importFees)).toEqual('0.00164');

        //
        // Compute gas fees
        //

        if (tx.description.type !== 'generic') {
            throw Error();
        }
        if (tx.description.computePhase.type !== 'computed') {
            throw Error();
        }
        let gasFees = computeGasPrices(tx.description.computePhase.gasUsed, { flatLimit: gasPrices.flatLimit, flatPrice: gasPrices.flatGasPrice, price: gasPrices.other.gasPrice });
        expect(fromNano(gasFees)).toEqual('0.003308'); // Verified via blockchain

        //
        // Forward fees
        //

        let fwdFees = computeMessageForwardFees(msgPrices, tx.outMessages[0].raw);
        expect(fromNano(fwdFees.fees)).toEqual('0.000333328'); // Verified via blockchain "All action fees"

        //
        // Total fees
        //

        let fees = new BN(0);
        fees = fees.add(storageFees);
        fees = fees.add(importFees);
        fees = fees.add(gasFees);
        fees = fees.add(fwdFees.fees);
        expect(fromNano(fees)).toEqual('0.005281337'); // Value from blockchain
    })

    // it('should compute storage fees', () => {
    //     let fees = computeStorageFees({
    //         lastPaid: 0,
    //         masterchain: false,
    //         now: 1,
    //         special: false,
    //         storagePrices: [{
    //             bit_price_ps: new BN(2),
    //             cell_price_ps: new BN(1),
    //             mc_bit_price_ps: new BN(1),
    //             mc_cell_price_ps: new BN(1),
    //             utime_since: new BN(0)
    //         }],
    //         storageStat: { bits: new BN(10), cells: new BN(1), publicCells: new BN(1) }
    //     });

    //     expect(fees.eq(new BN(0x15))).toBe(true);
    // });

    // it('should compute fwd fees', () => {
    //     let fees = computeFwdFees({
    //         bitPrice: new BN(1),
    //         lumpPrice: new BN(10),
    //         cellPrice: new BN(2),
    //         firstFrac: new BN(1),
    //         nextFrac: new BN(1),
    //         ihrPriceFactor: new BN(1)
    //     }, new BN(1), new BN(10));

    //     expect(fees.eq(new BN(0xb))).toBe(true);
    // });

    // it('should compute gas prices', () => {
    //     let fees = computeGasPrices(new BN(1000), {
    //         flatPrice: new BN(10),
    //         flatLimit: new BN(1000),
    //         price: new BN(10)
    //     });

    //     expect(fees.eq(new BN(0xa))).toBe(true);
    // });
})