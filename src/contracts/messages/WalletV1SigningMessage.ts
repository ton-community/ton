import { Maybe } from "../../types";
import { Message } from "../../messages/Message";
import { Builder } from "ton-core";

export class WalletV1SigningMessage implements Message {

    readonly seqno: number;
    readonly order: Message;
    readonly sendMode: number;

    constructor(args: { seqno: Maybe<number>, sendMode: number, order: Message }) {
        this.order = args.order;
        this.sendMode = args.sendMode;
        if (args.seqno !== undefined && args.seqno !== null) {
            this.seqno = args.seqno;
        } else {
            this.seqno = 0;
        }
    }

    writeTo(builder: Builder) {
        builder.storeUint(this.seqno, 32);
        builder.storeUint(this.sendMode, 8);
        this.order.writeTo(builder);
    }
}