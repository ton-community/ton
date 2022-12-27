import { Builder, Cell } from "ton-core";
import { Message } from "./Message";

export class CellMessage implements Message {

    private cell: Cell;

    constructor(cell: Cell) {
        this.cell = cell;
    }

    writeTo(builder: Builder) {
        builder.storeSlice(this.cell.beginParse());
    }
}