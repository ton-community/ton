import { Cell } from "../boc/Cell";
import { Message } from "./Message";

export class CellMessage implements Message {

    private cell: Cell;

    constructor(cell: Cell) {
        this.cell = cell;
    }

    writeTo(cell: Cell) {
        cell.writeCell(this.cell);
    }
}