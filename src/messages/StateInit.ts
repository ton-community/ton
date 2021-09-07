import { Cell } from "..";
import { Maybe } from "../types";
import { Message } from "./Message";

export class StateInit implements Message {

    readonly data: Cell | null;
    readonly code: Cell | null;

    constructor(opts: { code?: Maybe<Cell>, data?: Maybe<Cell> }) {
        if (opts.code !== null && opts.code !== undefined) {
            this.code = opts.code;
        } else {
            this.code = null;
        }
        if (opts.data !== null && opts.data !== undefined) {
            this.data = opts.data;
        } else {
            this.data = null;
        }
    }

    writeTo(cell: Cell) {
        cell.bits.writeBit(0); // SplitDepth
        cell.bits.writeBit(0); // TickTock
        cell.bits.writeBit(!!this.code); // Code presence
        cell.bits.writeBit(!!this.data); // Data presence
        cell.bits.writeBit(0); // Library
        if (this.code) {
            cell.refs.push(this.code);
        }
        if (this.data) {
            cell.refs.push(this.data);
        }
    }
}