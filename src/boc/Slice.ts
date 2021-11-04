import { BitStringReader, Cell } from "..";

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

    readRef = () => {
        let first = this.refs.shift()
        if (first) {
            return new Slice(first);
        } else {
            throw Error('No ref');
        }
    }
}