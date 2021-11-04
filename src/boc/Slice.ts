import { BitStringReader, Cell, parseDict } from "..";

export class Slice {
    readonly source: Cell;
    private readonly bits: BitStringReader;
    private readonly refs: Cell[] = [];

    constructor(cell: Cell) {
        this.source = cell;
        this.refs = [...cell.refs];
        this.bits = new BitStringReader(cell.bits);
    }

    skip = (bits: number) => {
        this.bits.skip(bits);
    }

    readUint = (bits: number) => {
        return this.bits.readUint(bits);
    }

    readUintNumber = (bits: number) => {
        return this.bits.readUintNumber(bits);
    }

    readBuffer = (size: number) => {
        return this.bits.readBuffer(size);
    }

    readBit = () => {
        return this.bits.readBit();
    }

    readCoins = () => {
        return this.bits.readCoins();
    }

    readRemaining = () => {
        return this.bits.readRemaining();
    }

    readAddress = () => {
        return this.bits.readAddress();
    }

    readUnaryLength = () => {
        return this.bits.readUnaryLength();
    }

    readOptDict = <T>(keySize: number, extractor: (slice: Slice) => T) => {
        if (this.readBit()) {
            return this.readDict(keySize, extractor);
        } else {
            return null;
        }
    }

    readDict = <T>(keySize: number, extractor: (slice: Slice) => T) => {
        let first = this.refs.shift();
        if (first) {
            return parseDict(first.beginParse(), keySize, extractor);
        } else {
            throw Error('No ref');
        }
    }

    readRef = () => {
        let first = this.refs.shift()
        if (first) {
            return new Slice(first);
        } else {
            throw Error('No ref');
        }
    }
}