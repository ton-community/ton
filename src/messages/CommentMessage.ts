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

            let bytes = Buffer.from(this.comment);
            let dest = cell;
            while (bytes.length > 0) {
                let avaliable = Math.floor(dest.bits.available / 8);
                if (bytes.length <= avaliable) {
                    dest.bits.writeBuffer(bytes);
                    break;
                }
                dest.bits.writeBuffer(bytes.slice(0, avaliable));
                bytes = bytes.slice(avaliable, bytes.length);
                let nc = new Cell();
                dest.refs.push(nc);
                dest = nc;
            }
        }
    }
}