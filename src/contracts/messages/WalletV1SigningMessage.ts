import { Cell } from "../../boc/Cell";
import { Maybe } from "../../types";
import { Message } from "../../messages/Message";

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

    writeTo(cell: Cell) {
        cell.bits.writeUint(this.seqno, 32);
        cell.bits.writeUint8(this.sendMode);

        // Write order
        let orderCell = new Cell();
        this.order.writeTo(orderCell);
        cell.refs.push(orderCell);
    }
}