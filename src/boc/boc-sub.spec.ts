import { readFile } from 'fs/promises';
import path from 'path';
import { parseAccount } from '../block/parse';
import { Cell } from './Cell';

describe('boc-sub', () => {
    it('should serialize sub cell', async () => {
        const data = await readFile(path.resolve(__dirname, '__testdata__', 'accountState.txt'), { encoding: 'utf-8' });
        const dataBuffer = Buffer.from(data, 'base64');

        console.warn('initial');
        const state = Cell.fromBoc(dataBuffer)[0];
        let account = parseAccount(state.beginParse())!;
        if (account.storage.state.type !== 'active') {
            throw Error('Invalid state');
        }
        // console.warn(account);
        let dt = account.storage.state.state.data!
        // console.warn(dt.toString());
        // console.warn(state);
        let s = dt.toBoc({ idx: false, crc32: false });
        // console.warn(data);
        // console.warn(s.toString('base64'));
        console.warn('secondary');
        let c = Cell.fromBoc(s)[0];
        expect(c.hash().equals(dt.hash())).toBe(true);
    });
});