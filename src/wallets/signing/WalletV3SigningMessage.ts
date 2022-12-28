import { Maybe } from "../../utils/maybe";
import { beginCell, Builder, Message } from "ton-core";

export class WalletV3SigningMessage implements Message {

    readonly timeout: number;
    readonly seqno: number;
    readonly walletId: number;
    readonly messages: Message[];
    readonly sendMode: number;

    constructor(args: { timeout?: Maybe<number>, seqno: Maybe<number>, walletId?: number, sendMode: number, messages: Message[] }) {
        this.messages = args.messages;
        this.sendMode = args.sendMode;
        if (args.timeout !== undefined && args.timeout !== null) {
            this.timeout = args.timeout;
        } else {
            this.timeout = Math.floor(Date.now() / 1e3) + 60; // Default timeout: 60 seconds
        }
        if (args.seqno !== undefined && args.seqno !== null) {
            this.seqno = args.seqno;
        } else {
            this.seqno = 0;
        }
        if (args.walletId !== null && args.walletId !== undefined) {
            this.walletId = args.walletId;
        } else {
            this.walletId = 698983191;
        }
    }

    writeTo(builder: Builder) {
        builder.storeUint(this.walletId, 32);
        if (this.seqno === 0) {
            for (let i = 0; i < 32; i++) {
                builder.storeBit(1);
            }
        } else {
            builder.storeUint(this.timeout, 32);
        }
        builder.storeUint(this.seqno, 32);

        // Write order
        for (let m of this.messages) {
            builder.storeUint(this.sendMode, 8);
            builder.storeRef(beginCell().storeWritable(m));
        }
    }
}