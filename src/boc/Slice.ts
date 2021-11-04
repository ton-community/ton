import { BitStringReader, Cell, parseDict } from "..";

export class Slice {
    private readonly bits: BitStringReader;
    private readonly refs: Cell[] = [];

    constructor(cell: Cell) {
        this.refs = cell.refs;
        this.bits = new BitStringReader(cell.bits);
    }

    skip = (bits: number) => {
        this.bits.skip(bits);
    }

    readUint = (bits: number) => {
        return this.bits.readUint(bits);
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
            return parseDict(first, keySize, (cell) => extractor(new Slice(cell)));
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