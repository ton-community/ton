import { Cell } from "../boc/Cell";
import { Message } from "./Message";

export class CommentMessage implements Message {

    readonly comment: string;

    constructor(comment: string) {
        this.comment = comment;
    }

    writeTo(cell: Cell) {
        if (this.comment.length > 0) {
            cell.bits.writeUint(0, 32);
            cell.bits.writeString(this.comment);
        }
    }
}