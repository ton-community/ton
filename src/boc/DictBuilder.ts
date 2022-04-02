import BN from "bn.js";
import { beginCell } from "./Builder";
import { Cell } from "./Cell";
import { serializeDict } from "./dict/serializeDict";

export class DictBuilder {
    private readonly keySize: number;
    private items = new Map<string, Cell>();
    private ended = false;

    constructor(keySize: number) {
        this.keySize = keySize;
    }

    storeCell = (index: number | BN | Buffer, value: Cell) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        let key: string;
        if (typeof index === 'number') {
            key = index.toString(10);
        } else if (BN.isBN(index)) {
            key = index.toString(10);
        } else if (Buffer.isBuffer(index)) {
            key = new BN(index.toString('hex'), 'hex').toString(10);
        } else {
            throw Error('Invalid index type');
        }
        if (this.items.has(key)) {
            throw Error('Item ' + index + ' already exist')
        }
        this.items.set(key, value);
    }

    storeRef = (index: number | BN | Buffer, value: Cell) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.storeCell(index,
            beginCell()
                .storeRef(value)
                .endCell()
        );
    }

    endDict = () => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.ended = true;
        if (this.items.size === 0) {
            return null;
        }
        return serializeDict<Cell>(this.items, this.keySize, (src, dst) => dst.writeCell(src));
    }

    endCell = () => {
        if (this.ended) {
            throw Error('Already ended')
        }
        if (this.items.size === 0) {
            throw Error('Dict is empty')
        }
        return this.endDict()!;
    }
}

export function beginDict(keyLength: number) {
    return new DictBuilder(keyLength);
}