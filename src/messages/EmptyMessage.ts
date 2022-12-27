import { Builder } from "ton-core";
import { Message } from "./Message";

export class EmptyMessage implements Message {
    writeTo(builder: Builder) {
        // Nothing to do
    }
}