import { readFile } from 'fs/promises';
import path from 'path';
import { deserializeBoc, deserializeCellData, parseBocHeader, serializeToBoc } from "./boc";
import { Cell } from './Cell';
import { topologicalSort } from "./utils/topologicalSort";

describe('boc-serialize', () => {
    it('should correctly serialize', () => {
        const data = 'te6ccgEBGAEA6AACAxDCAQIBY6kNoJVjtnQKS39oygn723awA1zBAUUKFuLnm5heu7OKDFdoYWxlcyBUb2tlbgNXSExAAwEZodzWUAAAAAMgAAADJgQAPh5odHRwczovL3RvbndoYWxlcy5jb20vY29udGVudC8CA8zABQYCASAHCAIBSBQVAgEgCQoCASAPEAALo4AAACzAAgEgCwwACbYAAADDAgFIDQ4ACUAAAAY4AAlQAAAF+AALpgAAADBAAgEgERcCAVgSEwAJQAAABcgACVAAAAXoAAuhgAAALsACASAWFwAJtAAAALcACdgAAALU';
        const dataBuffer = Buffer.from(data, 'base64');
        const cell = deserializeBoc(dataBuffer)[0];
        const data2 = cell.toBoc({ idx: false, crc32: false });
        const cell2 = deserializeBoc(data2)[0];
        const header1 = parseBocHeader(dataBuffer);
        const header2 = parseBocHeader(data2);
        console.warn(header1);
        console.warn(header2);

        const topology = topologicalSort(cell);
        console.warn(topology.map((v, i) => v.refs));

        // Header 1
        let cells_data = header1.cells_data;
        let cells_array = [];
        let refs_array: number[][] = [];
        for (let ci = 0; ci < header1.cells_num; ci++) {
            let dd = deserializeCellData(cells_data, header1.size_bytes);
            cells_data = dd.residue;
            cells_array.push(dd.cell);
            refs_array.push(dd.refs);
        }
        console.warn(refs_array);


        let cells_data2 = header2.cells_data;
        let cells_array2 = [];
        let refs_array2: number[][] = [];
        for (let ci = 0; ci < header2.cells_num; ci++) {
            let dd = deserializeCellData(cells_data2, header2.size_bytes);
            cells_data2 = dd.residue;
            cells_array2.push(dd.cell);
            refs_array2.push(dd.refs);
        }
        console.warn(refs_array2);
    });

    it('should serialize boc including >255 cells', async () => {
        const data = await readFile(path.resolve(__dirname, '__testdata__', 'largeBoc.txt'), { encoding: 'utf-8' });
        const dataBuffer = Buffer.from(data, 'base64');
        let boc = deserializeBoc(dataBuffer);
        boc = deserializeBoc(boc[0].toBoc());
    })

    it('should serialize boc with many refs', async () => {
        const data = await readFile(path.resolve(__dirname, '__testdata__', 'manyCells.txt'), { encoding: 'utf-8' });
        const dataBuffer = Buffer.from(data, 'base64');
        const state = Cell.fromBoc(dataBuffer)[0];
        state.toBoc({ idx: false }).toString('base64');
    });

    it('should serialize and parse exotics', async () => {
        const cell = new Cell('pruned');
        cell.refs.push(new Cell('merkle_proof'));
        cell.refs.push(new Cell('merkle_update'));
        let res = cell.toBoc({ idx: false });
        let p = Cell.fromBoc(res);
    });
});