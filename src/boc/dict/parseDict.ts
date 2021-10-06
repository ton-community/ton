import { BN } from "bn.js";
import { BitString } from "../BitString";
import { BitStringReader } from "../BitStringReader";
import { Cell } from "../Cell";

function doParse<T>(prefix: string, src: Cell, n: number, res: Map<string, T>, extractor: (cell: Cell, reader: BitStringReader) => T) {

    // Is Fork
    let reader = new BitStringReader(src.bits);

    // Reading label
    let lb0 = reader.readBit() ? 1 : 0;
    let prefixLength = 0;
    let pp = prefix;

    if (lb0 === 0) {
        // Short label detected

        // Read 
        prefixLength = reader.readUnaryLength();

        // Read prefix
        for (let i = 0; i < prefixLength; i++) {
            pp += reader.readBit() ? '1' : '0';
        }
    } else {
        let lb1 = reader.readBit() ? 1 : 0;
        if (lb1 === 0) {
            // Long label detected
            prefixLength = reader.readUintNumber(Math.ceil(Math.log2(n + 1)));
            console.warn(prefixLength);
            for (let i = 0; i < prefixLength; i++) {
                pp += reader.readBit() ? '1' : '0';
            }
        } else {
            // Same label detected
            let bit = reader.readBit() ? '1' : '0';
            prefixLength = reader.readUintNumber(Math.ceil(Math.log2(n + 1)));
            console.warn(prefixLength);
            for (let i = 0; i < prefixLength; i++) {
                pp += bit;
            }
        }
    }

    if (n - prefixLength === 0) {
        res.set(new BN(pp, 2).toString(10), extractor(src, reader));
    } else {
        // NOTE: Left and right branches are implicitly contain prefixes '0' and '1'
        doParse(pp + '0', src.refs[0], n - prefixLength - 1, res, extractor);
        doParse(pp + '1', src.refs[1], n - prefixLength - 1, res, extractor);
    }
}

export function parseDictBitString(src: Cell, keySize: number) {
    let res: Map<string, BitString> = new Map();
    doParse('', src, keySize, res, (c, reader) => reader.readRemaining());
    return res;
}

export function parseDictRefs(src: Cell, keySize: number) {
    let res: Map<string, Cell> = new Map();
    doParse('', src, keySize, res, (c) => c.refs[0]);
    return res;
}