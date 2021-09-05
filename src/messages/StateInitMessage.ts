import { Cell } from "../boc/Cell";
import { Maybe } from "../types";
import { Message } from "./Message";

export class StateInitMessage implements Message {

    readonly code: Cell | null;
    readonly data: Cell | null;

    constructor(opts: { code?: Maybe<Cell>, data?: Maybe<Cell> }) {
        if (opts.code) {
            this.code = opts.code;
        } else {
            this.code = null;
        }
        if (opts.data) {
            this.data = opts.data;
        } else {
            this.data = null;
        }
    }

    writeTo(cell: Cell) {
        cell.bits.writeBitArray([false, false, !!this.code, !!this.data, false]);
        if (this.code) {
            cell.refs.push(this.code);
        }
        if (this.data) {
            cell.refs.push(this.data);
        }
    }
}