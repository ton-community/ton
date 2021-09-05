import { BitString } from './BitString';

export class Cell {
    readonly bits = BitString.alloc(1023);
    readonly refs: Cell[] = [];
    readonly isExotic: boolean = false;

    writeCell(anotherCell: Cell) {
        this.bits.writeBitString(anotherCell.bits);
        for (let r of anotherCell.refs) {
            this.refs.push(r);
        }
    }
}