import { Maybe } from '../types';
import { BitString } from './BitString';
import { deserializeBoc, hashCell, serializeToBoc } from './boc';

export class Cell {

    static fromBoc(src: Buffer | string): Cell[] {
        return deserializeBoc(typeof src === 'string' ? Buffer.from(src, 'hex') : src);
    }

    readonly bits = BitString.alloc(1023);
    readonly refs: Cell[] = [];
    readonly isExotic: boolean;

    constructor(isExotic: boolean = false) {
        this.isExotic = isExotic;
    }

    writeCell(anotherCell: Cell) {
        this.bits.writeBitString(anotherCell.bits);
        for (let r of anotherCell.refs) {
            this.refs.push(r);
        }
    }

    hash() {
        return hashCell(this);
    }

    toBoc(opts?: { idx?: Maybe<boolean>, crc32?: Maybe<boolean>, cacheBits?: Maybe<boolean>, flags?: Maybe<number> }) {
        let idx = (opts && opts.idx !== null && opts.idx !== undefined) ? opts.idx : true;
        let crc32 = (opts && opts.crc32 !== null && opts.crc32 !== undefined) ? opts.crc32 : true;
        let cacheBits = (opts && opts.cacheBits !== null && opts.cacheBits !== undefined) ? opts.cacheBits : false;
        let flags = (opts && opts.flags !== null && opts.flags !== undefined) ? opts.flags : 0;
        return serializeToBoc(this, idx, crc32, cacheBits, flags);
    }

    toString(indent?: string): string {
        let id = indent || '';
        let s = id + 'x{' + this.bits.toFiftHex() + '}\n';
        for (let k in this.refs) {
            const i = this.refs[k];
            s += i.toString(id + ' ');
        }
        return s;
    }
}