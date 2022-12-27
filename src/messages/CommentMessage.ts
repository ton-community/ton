import { Builder } from "ton-core";
import { writeString } from "../utils/strings";
import { Message } from "./Message";

export class CommentMessage implements Message {

    readonly comment: string;

    constructor(comment: string) {
        this.comment = comment;
    }

    writeTo(builder: Builder) {
        if (this.comment.length > 0) {
            builder.storeUint(0, 32);
            writeString(this.comment, builder);
        }
    }
}