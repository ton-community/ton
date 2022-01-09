import { CommonMessageInfo } from "..";
import { Address } from "../address/Address";
import { Cell } from "../boc/Cell";
import { Message } from "./Message";

export class ExternalMessage implements Message {

    readonly from: Address | null;
    readonly to: Address;
    readonly importFee: number;
    readonly body: CommonMessageInfo;

    constructor(opts: { to: Address, from?: Address | null, importFee?: number | null, body: CommonMessageInfo }) {
        this.to = opts.to;
        this.body = opts.body;
        if (opts.from !== undefined && opts.from !== null) {
            this.from = opts.from;
        } else {
            this.from = null;
        }
        if (opts.importFee !== undefined && opts.importFee !== null) {
            this.importFee = opts.importFee;
        } else {
            this.importFee = 0;
        }
    }

    writeTo(cell: Cell) {
        cell.bits.writeUint(2, 2);
        cell.bits.writeAddress(this.from);
        cell.bits.writeAddress(this.to);
        cell.bits.writeCoins(this.importFee);
        this.body.writeTo(cell);
    }
}