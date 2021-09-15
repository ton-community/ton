import { Maybe } from '../types';
import { BitString } from './BitString';
const NativeCell = require('tonweb/src/boc/Cell').Cell;


export class Cell {

    static fromNative(src: any) {
        let res = new Cell();
        src.bits.forEach((v: boolean) => {
            res.bits.writeBit(v);
        });
        for (let ref of src.refs) {
            res.refs.push(Cell.fromNative(ref));
        }
        return res;
    }

    static fromBoc(src: Buffer | string): Cell[] {
        let s = typeof src === 'string' ? Buffer.from(src, 'hex') : src;
        let r = NativeCell.fromBoc(s.toString('hex'));
        let res: Cell[] = [];
        for (let rr of r) {
            res.push(Cell.fromNative(rr));
        }
        return res;
    }

    static toNative(src: Cell) {
        let res = new NativeCell();
        for (let v of src.bits) {
            res.bits.writeBit(v);
        }
        for (let ref of src.refs) {
            res.refs.push(Cell.toNative(ref));
        }
        return res;
    }

    readonly bits = BitString.alloc(1023);
    readonly refs: Cell[] = [];
    readonly isExotic: boolean = false;

    writeCell(anotherCell: Cell) {
        this.bits.writeBitString(anotherCell.bits);
        for (let r of anotherCell.refs) {
            this.refs.push(r);
        }
    }

    async hash() {
        return Buffer.from(await Cell.toNative(this).hash());
    }

    async toBoc(opts?: { idx?: Maybe<boolean>, crc32?: Maybe<boolean>, cacheBits?: Maybe<boolean>, flags?: Maybe<number> }) {
        let idx = (opts && opts.idx !== null && opts.idx !== undefined) ? opts.idx : true;
        let crc32 = (opts && opts.crc32 !== null && opts.crc32 !== undefined) ? opts.crc32 : true;
        let cacheBits = (opts && opts.cacheBits !== null && opts.cacheBits !== undefined) ? opts.cacheBits : false;
        let flags = (opts && opts.flags !== null && opts.flags !== undefined) ? opts.flags : 0;
        return Buffer.from(await Cell.toNative(this).toBoc(idx, crc32, cacheBits, flags));
    }

    toHex(): string {
        return Cell.toNative(this).print();
    }
}