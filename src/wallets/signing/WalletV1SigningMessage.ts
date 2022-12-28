import { Maybe } from "../../utils/maybe";
import { beginCell, Builder, Message } from "ton-core";

export class WalletV1SigningMessage implements Message {

    readonly seqno: number;
    readonly messages: Message[];
    readonly sendMode: number;

    constructor(args: { seqno: Maybe<number>, sendMode: number, messages: Message[] }) {
        this.messages = args.messages;
        this.sendMode = args.sendMode;
        if (args.seqno !== undefined && args.seqno !== null) {
            this.seqno = args.seqno;
        } else {
            this.seqno = 0;
        }
    }

    writeTo(builder: Builder) {
        builder.storeUint(this.seqno, 32);
        for (let m of this.messages) {
            builder.storeUint(this.sendMode, 8);
            builder.storeRef(beginCell().storeWritable(m));
        }
    }
}