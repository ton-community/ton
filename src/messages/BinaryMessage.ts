import { Cell } from "../boc/Cell";
import { Message } from "./Message";

export class BinaryMessage implements Message {

    readonly payload: Buffer;

    constructor(payload: Buffer) {
        this.payload = payload;
    }

    writeTo(cell: Cell) {
        cell.bits.writeBuffer(this.payload);
    }
}