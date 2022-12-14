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

    readBigNumberOpt() {
        let popped = this.pop();
        if (popped.type === 'null') {
            return null;
        }
        if (popped.type !== 'int') {
            throw Error('Not a number');
        }
        return popped.value;
    }

    readNumber() {
        return this.readBigNumber().toNumber();
    }

    readNumberOpt() {
        let r = this.readBigNumberOpt();
        if (r !== null) {
            return r.toNumber();
        } else {
            return null;
        }
    }

    readBoolean() {
        let res = this.readNumber();
        return res === 0 ? false : true;
    }

    readBooleanOpt() {
        let res = this.readNumberOpt();
        if (res !== null) {
            return res === 0 ? false : true;
        } else {
            return null;
        }
    }

    readAddress() {
        let r = this.readCell().beginParse().readAddress();
        if (r !== null) {
            return r;
        } else {
            throw Error('Not an address');
        }
    }

    readAddressOpt() {
        let r = this.readCellOpt();
        if (r !== null) {
            return r.beginParse().readAddress();
        } else {
            return null;
        }
    }

    readCell() {
        let popped = this.pop();
        if (popped.type !== 'cell' && popped.type !== 'slice' && popped.type !== 'builder') {
            throw Error('Not a cell');
        }
        return popped.cell;
    }

    readCellOpt() {
        let popped = this.pop();
        if (popped.type === 'null') {
            return null;
        }
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

    readTupleOpt() {
        let popped = this.pop();
        if (popped.type === 'null') {
            return null;
        }
        if (popped.type !== 'tuple') {
            throw Error('Not a number');
        }
        return new TupleSlice4(popped.items);
    }
}