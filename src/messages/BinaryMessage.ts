import { Builder } from "ton-core";
import { Message } from "./Message";

export class BinaryMessage implements Message {

    readonly payload: Buffer;

    constructor(payload: Buffer) {
        this.payload = payload;
    }

    writeTo(builder: Builder) {
        builder.storeBuffer(this.payload);
    }
}