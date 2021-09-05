import { Cell } from "../boc/Cell";
import { Message } from "./Message";

export class EmptyMessage implements Message {
    writeTo(cell: Cell) {
        // Nothing to do
    }
}