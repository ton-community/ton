import { Builder, Cell } from "ton-core";
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

    writeTo(builder: Builder) {
        builder.storeBit(0);
        builder.storeBit(0); // SplitDepth
        builder.storeBit(0); // TickTock
        builder.storeMaybeRef(this.code); // Code
        builder.storeMaybeRef(this.data); // Code
        builder.storeBit(0); // Library
    }
}