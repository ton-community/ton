import { readFile } from 'fs/promises';
import path from 'path';
import { Cell } from './Cell';

describe('boc-sub', () => {
    it('should serialize sub cell', async () => {
        const data = await readFile(path.resolve(__dirname, '__testdata__', 'accountState.txt'), { encoding: 'utf-8' });
        const dataBuffer = Buffer.from(data, 'base64');
        const state = Cell.fromBoc(dataBuffer)[0];
        let s = state.toBoc({ idx: false });
        let c = Cell.fromBoc(s)[0];
        expect(c.hash().equals(state.hash())).toBe(true);
    });
});