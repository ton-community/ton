import { Cell } from "../../boc/Cell";
import { Maybe } from "../../types";
import { Message } from "../Message";

export class WalletV3SigningMessage implements Message {

    readonly timestamp: number;
    readonly seqno: number;
    readonly walletId: number;
    readonly order: Message;
    readonly sendMode: number;

    constructor(args: { timestamp?: Maybe<number>, seqno: Maybe<number>, walletId?: number, sendMode: number, order: Message }) {
        this.order = args.order;
        this.sendMode = args.sendMode;
        if (args.timestamp !== undefined && args.timestamp !== null) {
            this.timestamp = args.timestamp;
        } else {
            this.timestamp = Date.now();
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

    writeTo(cell: Cell) {
        cell.bits.writeUint(this.walletId, 32);
        if (this.seqno === 0) {
            for (let i = 0; i < 32; i++) {
                cell.bits.writeBit(1);
            }
        } else {
            const timestamp = Math.floor(this.timestamp / 1e3); // In seconds
            cell.bits.writeUint(timestamp + 60, 32); // 60 seconds timeout
        }
        cell.bits.writeUint(this.seqno, 32);
        cell.bits.writeUint8(this.sendMode);

        // Write order
        let orderCell = new Cell();
        this.order.writeTo(orderCell);
        cell.refs.push(orderCell);
    }
}