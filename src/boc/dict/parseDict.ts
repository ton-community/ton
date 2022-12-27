import { BitString, Cell, Slice } from "ton-core";

function readUnaryLength(slice: Slice) {
    let res = 0;
    while (slice.loadBit()) {
        res++;
    }
    return res;
}

function doParse<T>(prefix: string, slice: Slice, n: number, res: Map<string, T>, extractor: (slice: Slice) => T) {

    // Reading label
    let lb0 = slice.loadBit() ? 1 : 0;
    let prefixLength = 0;
    let pp = prefix;

    if (lb0 === 0) {
        // Short label detected

        // Read 
        prefixLength = readUnaryLength(slice);

        // Read prefix
        for (let i = 0; i < prefixLength; i++) {
            pp += slice.loadBit() ? '1' : '0';
        }
    } else {
        let lb1 = slice.loadBit() ? 1 : 0;
        if (lb1 === 0) {
            // Long label detected
            prefixLength = slice.loadUint(Math.ceil(Math.log2(n + 1)));
            for (let i = 0; i < prefixLength; i++) {
                pp += slice.loadBit() ? '1' : '0';
            }
        } else {
            // Same label detected
            let bit = slice.loadBit() ? '1' : '0';
            prefixLength = slice.loadUint(Math.ceil(Math.log2(n + 1)));
            for (let i = 0; i < prefixLength; i++) {
                pp += bit;
            }
        }
    }

    if (n - prefixLength === 0) {
        res.set(BigInt('0b' + pp).toString(10), extractor(slice));
    } else {
        let left = slice.loadRef();
        let right = slice.loadRef();
        // NOTE: Left and right branches are implicitly contain prefixes '0' and '1'
        if (!left.isExotic) {
            doParse(pp + '0', left.beginParse(), n - prefixLength - 1, res, extractor);
        }
        if (!right.isExotic) {
            doParse(pp + '1', right.beginParse(), n - prefixLength - 1, res, extractor);
        }
    }
}

export function parseDict<T>(cell: Cell | null, keySize: number, extractor: (slice: Slice) => T) {
    let res: Map<string, T> = new Map();
    if (cell) {
        doParse('', cell.beginParse(), keySize, res, extractor);
    }
    return res;
}

export function parseDictBitString(cell: Cell | null, keySize: number) {
    let res: Map<string, BitString> = new Map();
    if (cell) {
        doParse('', cell.beginParse(), keySize, res, (s) => s.preloadBits(s.remainingBits));
    }
    return res;
}

export function parseDictRefs(cell: Cell | null, keySize: number) {
    let res: Map<string, Slice> = new Map();
    if (cell) {
        doParse('', cell.beginParse(), keySize, res, (slice) => slice.loadRef().beginParse());
    }
    return res;
}