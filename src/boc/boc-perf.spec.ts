import { readFile } from 'fs/promises';
import path from 'path';
import { Cell } from './Cell';

describe('boc-perf', () => {
    it('should serialize huge boc', async () => {
        const data = await readFile(path.resolve(__dirname, '__testdata__', 'veryLarge.boc'));
        let cell = Cell.fromBoc(data)[0];
        let serialzied = cell.toBoc({ idx: false });
        console.warn(serialzied);
    });
});