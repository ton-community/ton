import { StackItem } from "../block/stack";

export class TupleSlice4 {
    private readonly items: StackItem[];

    constructor(items: StackItem[]) {
        this.items = [...items];
    }

    get remaining() {
        return this.items.length;
    }

    pop() {
        if (this.items.length === 0) {
            throw Error('EOF');
        }
        let res = this.items[0];
        this.items.splice(0, 1);
        return res;
    }

    readBigNumber() {
        let popped = this.pop();
        if (popped.type !== 'int') {
            throw Error('Not a number');
        }
        return popped.value;
    }

    readNumber() {
        return this.readBigNumber().toNumber();
    }

    readBoolean() {
        let res = this.readNumber();
        return res === 0 ? false : true;
    }

    readAddress() {
        return this.readCell().beginParse().readAddress();
    }

    readCell() {
        let popped = this.pop();
        if (popped.type !== 'cell' && popped.type !== 'slice' && popped.type !== 'builder') {
            throw Error('Not a cell');
        }
        return popped.cell;
    }

    readTuple() {
        let popped = this.pop();
        if (popped.type !== 'tuple') {
            throw Error('Not a number');
        }
        return new TupleSlice4(popped.items);
    }
}