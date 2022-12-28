import { Maybe } from "../../utils/maybe";
import { beginCell, Builder, Message } from "ton-core";

export class WalletV1SigningMessage implements Message {

    readonly seqno: number;
    readonly message: Maybe<Message>;
    readonly sendMode: number;

    constructor(args: { seqno: Maybe<number>, sendMode: number, message: Maybe<Message> | null }) {
        this.message = args.message;
        this.sendMode = args.sendMode;
        if (args.seqno !== undefined && args.seqno !== null) {
            this.seqno = args.seqno;
        } else {
            this.seqno = 0;
        }
    }

    writeTo(builder: Builder) {
        builder.storeUint(this.seqno, 32);
        if (this.message) {
            builder.storeUint(this.sendMode, 8);
            builder.storeRef(beginCell().storeWritable(this.message));
        }
    }
}