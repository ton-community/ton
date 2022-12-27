import { beginCell, Builder } from "ton-core";
import { Maybe } from "../types";
import { Message } from "./Message";

export class CommonMessageInfo implements Message {

    readonly stateInit: Message | null;
    readonly body: Message | null;

    constructor(opts?: { stateInit?: Maybe<Message>, body?: Maybe<Message> }) {
        if (opts && opts.stateInit !== null && opts.stateInit !== undefined) {
            this.stateInit = opts.stateInit;
        } else {
            this.stateInit = null;
        }
        if (opts && opts.body !== null && opts.body !== undefined) {
            this.body = opts.body;
        } else {
            this.body = null;
        }
    }

    writeTo(builder: Builder) {

        // Write state
        if (this.stateInit) {
            builder.storeBit(1);
            const stateInitCell = beginCell();
            this.stateInit.writeTo(stateInitCell);

            //-1:  need at least one bit for body
            if (builder.availableBits - 1 /* At least on byte for body */ >= stateInitCell.bits) {
                builder.storeBit(0);
                builder.storeBuilder(stateInitCell);
            } else {
                builder.storeBit(1);
                builder.storeRef(stateInitCell.endCell());
            }
        } else {
            builder.storeBit(0);
        }

        // Write body
        if (this.body) {
            const body = beginCell();
            this.body.writeTo(body);
            if ((1023 - builder.bits) - 1 /* At least on byte for body */ >= body.bits) {
                builder.storeBit(0);
                builder.storeBuilder(body);
            } else {
                builder.storeBit(1);
                builder.storeRef(body.endCell());
            }
        } else {
            builder.storeBit(0);
        }
    }
}