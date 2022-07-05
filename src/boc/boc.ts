import { sha256_sync } from "ton-crypto";
import { BitString, Cell } from "..";
import { CellType } from "./CellType";
import { crc32c } from "./utils/crc32c";
import { topologicalSort } from "./utils/topologicalSort";

const reachBocMagicPrefix = Buffer.from('B5EE9C72', 'hex');
const leanBocMagicPrefix = Buffer.from('68ff65f3', 'hex');
const leanBocMagicPrefixCRC = Buffer.from('acc3a728', 'hex');
let cacheContext: symbol | null = null;

type CellCache = {
    hash: Buffer | null;
    maxDepth: number | null;
}
function getCellCache(src: Cell): CellCache {
    if (!cacheContext) {
        throw Error('No cache context');
    }
    let ex = (src as any)[cacheContext] as CellCache;
    if (!ex) {
        ex = { hash: null, maxDepth: null };
        (src as any)[cacheContext] = ex;
    }
    return ex;
}

function inCache<T>(cell: Cell, handler: (cache: CellCache) => T): T {
    let wasCreated = false;
    if (!cacheContext) {
        wasCreated = true;
        cacheContext = Symbol();
    }
    let cache = getCellCache(cell);
    try {
        return handler(cache);
    } finally {
        if (wasCreated) {
            cacheContext = null;
        }
    }
}


//
// Hash Content
//

export function getMaxDepth(cell: Cell): number {
    return inCache(cell, (cache) => {
        if (cache.maxDepth !== null) {
            return cache.maxDepth;
        }
        let maxDepth = 0;
        if (cell.refs.length > 0) {
            for (let k in cell.refs) {
                const i = cell.refs[k];
                if (getMaxDepth(i) > maxDepth) {
                    maxDepth = getMaxDepth(i);
                }
            }
            maxDepth = maxDepth + 1;
        }
        cache.maxDepth = maxDepth;
        return maxDepth;
    })
}

function getMaxDepthAsArray(cell: Cell) {
    const maxDepth = getMaxDepth(cell);
    const d = Uint8Array.from({ length: 2 }, () => 0);
    d[1] = maxDepth % 256;
    d[0] = Math.floor(maxDepth / 256);
    return Buffer.from(d);
}

export function getMaxLevel(cell: Cell) {
    //TODO level calculation differ for exotic cells
    // let maxLevel = 0;
    // for (let k in cell.refs) {
    //     const i = cell.refs[k];
    //     if (getMaxLevel(i) > maxLevel) {
    //         maxLevel = getMaxLevel(i);
    //     }
    // }
    // return maxLevel;
    return 0;
}

function getRefsDescriptor(cell: Cell) {
    const d1 = Uint8Array.from({ length: 1 }, () => 0);
    d1[0] = cell.refs.length + (cell.isExotic ? 1 : 0) * 8 + getMaxLevel(cell) * 32;
    return Buffer.from(d1);
}

function getBitsDescriptor(cell: Cell) {
    const d2 = Uint8Array.from({ length: 1 }, () => 0);
    let len = cell.bits.cursor;
    if (cell.isExotic) {
        len += 8;
    }
    d2[0] = Math.ceil(len / 8) + Math.floor(len / 8);
    return Buffer.from(d2);
}

function getDataWithDescriptors(cell: Cell) {
    const d1 = getRefsDescriptor(cell);
    const d2 = getBitsDescriptor(cell);
    const tuBits = cell.bits.getTopUppedArray();
    return Buffer.concat([d1, d2, tuBits]);
}

function getRepr(cell: Cell) {
    const reprArray: Buffer[] = [];
    reprArray.push(getDataWithDescriptors(cell));
    for (let k in cell.refs) {
        const i = cell.refs[k];
        reprArray.push(getMaxDepthAsArray(i));
    }
    for (let k in cell.refs) {
        const i = cell.refs[k];
        reprArray.push(i.hash());
    }
    let x = Buffer.alloc(0);
    for (let k in reprArray) {
        const i = reprArray[k];
        x = Buffer.concat([x, i]);
    }
    return x;
}

export function hashCell(cell: Cell): Buffer {
    return inCache(cell, (cache) => {
        if (cache.hash) {
            return cache.hash;
        }
        let r = sha256_sync(getRepr(cell));
        cache.hash = r;
        return r;
    });
}

//
// Deserialize
//

function readNBytesUIntFromArray(n: number, ui8array: Buffer) {
    let res = 0;
    for (let c = 0; c < n; c++) {
        res *= 256;
        res += ui8array[c];
    }
    return res;
}

export function parseBocHeader(serializedBoc: Buffer) {
    // snake_case is used to match TON docs

    // Preflight check
    if (serializedBoc.length < 4 + 1) {
        throw new Error('Not enough bytes for magic prefix');
    }
    const inputData = serializedBoc; // Save copy for crc32

    // Parse prefix
    const prefix = serializedBoc.slice(0, 4);
    serializedBoc = serializedBoc.slice(4);
    let has_idx = false;
    let hash_crc32 = false;
    let has_cache_bits = false;
    let flags = 0;
    let size_bytes = 0;
    if (prefix.equals(reachBocMagicPrefix)) {
        const flags_byte = serializedBoc[0];
        has_idx = !!(flags_byte & 128);
        hash_crc32 = !!(flags_byte & 64);
        has_cache_bits = !!(flags_byte & 32);
        flags = (flags_byte & 16) * 2 + (flags_byte & 8);
        size_bytes = flags_byte % 8;
    } else if (prefix.equals(leanBocMagicPrefix)) {
        has_idx = true;
        hash_crc32 = false;
        has_cache_bits = false;
        flags = 0;
        size_bytes = serializedBoc[0];
    } else if (prefix.equals(leanBocMagicPrefixCRC)) {
        has_idx = true;
        hash_crc32 = true;
        has_cache_bits = false;
        flags = 0;
        size_bytes = serializedBoc[0];
    } else {
        throw Error('Unknown magic prefix');
    }

    // Counters
    serializedBoc = serializedBoc.slice(1);
    if (serializedBoc.length < 1 + 5 * size_bytes) {
        throw new Error('Not enough bytes for encoding cells counters');
    }
    const offset_bytes = serializedBoc[0];
    serializedBoc = serializedBoc.slice(1);
    const cells_num = readNBytesUIntFromArray(size_bytes, serializedBoc);
    serializedBoc = serializedBoc.slice(size_bytes);
    const roots_num = readNBytesUIntFromArray(size_bytes, serializedBoc);
    serializedBoc = serializedBoc.slice(size_bytes);
    const absent_num = readNBytesUIntFromArray(size_bytes, serializedBoc);
    serializedBoc = serializedBoc.slice(size_bytes);
    const tot_cells_size = readNBytesUIntFromArray(offset_bytes, serializedBoc);
    serializedBoc = serializedBoc.slice(offset_bytes);
    if (serializedBoc.length < roots_num * size_bytes) {
        throw new Error('Not enough bytes for encoding root cells hashes');
    }

    // Roots
    let root_list = [];
    for (let c = 0; c < roots_num; c++) {
        root_list.push(readNBytesUIntFromArray(size_bytes, serializedBoc));
        serializedBoc = serializedBoc.slice(size_bytes);
    }

    // Index
    let index: number[] | null = null;
    if (has_idx) {
        index = [];
        if (serializedBoc.length < offset_bytes * cells_num)
            throw new Error("Not enough bytes for index encoding");
        for (let c = 0; c < cells_num; c++) {
            index.push(readNBytesUIntFromArray(offset_bytes, serializedBoc));
            serializedBoc = serializedBoc.slice(offset_bytes);
        }
    }

    // Cells
    if (serializedBoc.length < tot_cells_size) {
        throw new Error('Not enough bytes for cells data');
    }
    const cells_data = serializedBoc.slice(0, tot_cells_size);
    serializedBoc = serializedBoc.slice(tot_cells_size);

    // CRC32
    if (hash_crc32) {
        if (serializedBoc.length < 4) {
            throw new Error('Not enough bytes for crc32c hashsum');
        }
        const length = inputData.length;
        if (!crc32c(inputData.slice(0, length - 4)).equals(serializedBoc.slice(0, 4))) {
            throw new Error('Crc32c hashsum mismatch');
        }
        serializedBoc = serializedBoc.slice(4);
    }

    // Check if we parsed everything
    if (serializedBoc.length) {
        throw new Error('Too much bytes in BoC serialization');
    }
    return {
        has_idx: has_idx,
        hash_crc32: hash_crc32,
        has_cache_bits: has_cache_bits,
        flags: flags,
        size_bytes: size_bytes,
        off_bytes: offset_bytes,
        cells_num: cells_num,
        roots_num: roots_num,
        absent_num: absent_num,
        tot_cells_size: tot_cells_size,
        root_list: root_list,
        index: index,
        cells_data: cells_data
    };
}

export function deserializeCellData(cellData: Buffer, referenceIndexSize: number) {
    if (cellData.length < 2) {
        throw new Error('Not enough bytes to encode cell descriptors');
    }
    const d1 = cellData[0], d2 = cellData[1];
    cellData = cellData.slice(2);
    // const level = Math.floor(d1 / 32);
    const isExotic = !!(d1 & 8);
    const refNum = d1 % 8;
    let dataBytesize = Math.ceil(d2 / 2);
    const fullfilledBytes = !(d2 % 2);

    // Build Cell
    let bits = BitString.alloc(1023);
    let refs: number[] = [];
    if (cellData.length < dataBytesize + referenceIndexSize * refNum) {
        throw new Error('Not enough bytes to encode cell data');
    }

    // Cell data
    let kind: CellType = 'ordinary';
    if (isExotic) {
        let k = cellData.readUInt8();
        if (k === 1) {
            kind = 'pruned';
        } else if (k === 2) {
            kind = 'library_reference';
        } else if (k === 3) {
            kind = 'merkle_proof';
        } else if (k === 4) {
            kind = 'merkle_update';
        } else {
            throw Error('Invalid cell type: ' + k);
        }
        cellData = cellData.slice(1);
        dataBytesize--;
    }
    bits.setTopUppedArray(cellData.slice(0, dataBytesize), fullfilledBytes);
    cellData = cellData.slice(dataBytesize);

    // References
    for (let r = 0; r < refNum; r++) {
        refs.push(readNBytesUIntFromArray(referenceIndexSize, cellData));
        cellData = cellData.slice(referenceIndexSize);
    }

    // Resolve kind
    let cell = new Cell(kind, bits);

    return { cell, refs, residue: cellData };
}

export function deserializeBoc(serializedBoc: Buffer) {
    const header = parseBocHeader(serializedBoc);
    let cells_data = header.cells_data;
    let cells_array = [];
    let refs_array: number[][] = [];
    for (let ci = 0; ci < header.cells_num; ci++) {
        let dd = deserializeCellData(cells_data, header.size_bytes);
        cells_data = dd.residue;
        cells_array.push(dd.cell);
        refs_array.push(dd.refs);
    }
    for (let ci = header.cells_num - 1; ci >= 0; ci--) {
        let c = refs_array[ci];
        for (let ri = 0; ri < c.length; ri++) {
            const r = c[ri];
            if (r < ci) {
                throw new Error('Topological order is broken');
            }
            cells_array[ci].refs[ri] = cells_array[r];
        }
    }
    let root_cells = [];
    for (let ri of header.root_list) {
        root_cells.push(cells_array[ri]);
    }
    return root_cells;
}

//
// Serialize
//

function serializeForBoc(cell: Cell, refs: number[], sSize: number) {
    const reprArray: Buffer[] = [];

    reprArray.push(getRefsDescriptor(cell));
    reprArray.push(getBitsDescriptor(cell));
    if (cell.isExotic) {
        if (cell.kind === 'pruned') {
            reprArray.push(Buffer.from([1]));
        } else if (cell.kind === 'library_reference') {
            reprArray.push(Buffer.from([2]));
        } else if (cell.kind === 'merkle_proof') {
            reprArray.push(Buffer.from([3]));
        } else if (cell.kind === 'merkle_update') {
            reprArray.push(Buffer.from([4]));
        } else {
            throw Error('Invalid cell type');
        }
    }
    reprArray.push(cell.bits.getTopUppedArray());
    for (let refIndexInt of refs) {
        // const i = cell.refs[k];
        // const refHash = (await i.hash()).toString('hex');
        // const refIndexInt = cellsIndex[refHash];
        // refIndexInt
        let refIndexHex = refIndexInt.toString(16);
        while (refIndexHex.length < sSize * 2) {
            // Add leading zeros
            refIndexHex = '0' + refIndexHex;
        }
        const reference = Buffer.from(refIndexHex, 'hex');
        reprArray.push(reference);
    }
    let x = Buffer.alloc(0);
    for (let k in reprArray) {
        const i = reprArray[k];
        x = Buffer.concat([x, i]);
    }
    return x;
}

export function serializeToBoc(cell: Cell, has_idx = true, hash_crc32 = true, has_cache_bits = false, flags = 0) {
    return inCache(cell, () => {
        const root_cell = cell;
        const allCells = topologicalSort(root_cell);
        const cells_num = allCells.length;
        const s = cells_num.toString(2).length; // Minimal number of bits to represent reference (unused?)
        const s_bytes = Math.max(Math.ceil(s / 8), 1);
        let full_size = 0;
        let sizeIndex: number[] = [];
        for (let cell_info of allCells) {
            full_size = full_size + (serializeForBoc(cell_info.cell, cell_info.refs, s_bytes)).length;
            sizeIndex.push(full_size);
        }
        const offset_bits = full_size.toString(2).length; // Minimal number of bits to offset/len (unused?)
        const offset_bytes = Math.max(Math.ceil(offset_bits / 8), 1);

        const serialization = BitString.alloc((1023 + 32 * 4 + 32 * 3) * allCells.length);
        serialization.writeBuffer(reachBocMagicPrefix);
        serialization.writeBitArray([has_idx, hash_crc32, has_cache_bits]);
        serialization.writeUint(flags, 2);
        serialization.writeUint(s_bytes, 3);
        serialization.writeUint8(offset_bytes);
        serialization.writeUint(cells_num, s_bytes * 8);
        serialization.writeUint(1, s_bytes * 8); // One root for now
        serialization.writeUint(0, s_bytes * 8); // Complete BOCs only
        serialization.writeUint(full_size, offset_bytes * 8);
        serialization.writeUint(0, s_bytes * 8); // Root shoulh have index 0
        if (has_idx) {
            allCells.forEach(
                (cell_data, index) =>
                    serialization.writeUint(sizeIndex[index], offset_bytes * 8));
        }
        for (let cell_info of allCells) {
            //TODO it should be async map or async for
            const refcell_ser = serializeForBoc(cell_info.cell, cell_info.refs, s_bytes);
            serialization.writeBuffer(refcell_ser);
        }
        let ser_arr = serialization.getTopUppedArray();
        if (hash_crc32) {
            ser_arr = Buffer.concat([ser_arr, crc32c(ser_arr)]);
        }

        return ser_arr;
    });
}