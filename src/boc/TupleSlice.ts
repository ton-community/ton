import { BN } from "bn.js";
import { bnToAddress } from "../utils/bnToAddress";
import { Cell } from "./Cell";

export class TupleSlice {
    private readonly items: any[];

    constructor(items: any[]) {
        this.items = [...items];
    }

    get remaining() {
        return this.items.length;
    }

    readNumber() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = parseInt(this.items[0][1]);
        this.items.splice(0, 1);
        return res;
    }

    readBoolean() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = parseInt(this.items[0][1]);
        this.items.splice(0, 1);
        return res === 0 ? false : true;
    }

    readBigNumber() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = new BN((this.items[0][1] as string).slice(2), 'hex');
        this.items.splice(0, 1);
        return res;
    }

    readCell() {
        if (this.items[0][0] !== 'cell') {
            throw Error('Not a cell');
        }
        let res = Cell.fromBoc(Buffer.from(this.items[0][1].bytes as string, 'base64'))[0];
        this.items.splice(0, 1);
        return res;
    }

    readNumericAddress(chain: number) {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let bn = this.readBigNumber();
        return bnToAddress(chain, bn);
    }
}