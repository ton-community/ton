import { BitString } from './BitString';
const TonWeb = require('tonweb');


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

    static fromBoc(src: Buffer): Cell[] {
        let r = TonWeb.boc.Cell.fromBoc(src.toString('hex'));
        let res: Cell[] = [];
        for (let rr of r) {
            res.push(Cell.fromNative(rr));
        }
        return res;
    }

    static toNative(src: Cell) {
        let res = new TonWeb.boc.Cell();
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

    toHex(): string {
        return Cell.toNative(this).print();
    }
}