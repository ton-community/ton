import { Cell } from "../boc/Cell";

export interface Message {
    writeTo(cell: Cell): void;
}