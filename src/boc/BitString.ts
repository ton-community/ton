import BN from 'bn.js';
import { Address } from '../address/Address';
import inspectSymbol from 'symbol.inspect';
import { BitStringReader } from '..';

export class BitString implements Iterable<boolean> {

    static alloc(length: number) {
        return new BitString(Buffer.alloc(Math.ceil(length / 8), 0), length, 0);
    }

    #length: number;
    #cursor: number;
    #buffer: Buffer;

    private constructor(buffer: Buffer, length: number, cursor: number) {
        this.#buffer = buffer;
        this.#length = length;
        this.#cursor = cursor;
    }

    get available() {
        return this.length - this.cursor;
    }

    get length() {
        return this.#length;
    }

    get cursor() {
        return this.#cursor;
    }

    get buffer() {
        return this.#buffer;
    }

    [Symbol.iterator] = (): Iterator<boolean> => {
        let offset = 0;
        let end = this.#cursor;
        return {
            next: () => {
                if (offset < end) {
                    let v = this.get(offset);
                    offset++;
                    return {
                        done: false,
                        value: v
                    }
                } else {
                    return {
                        done: true
                    };
                }
            }
        };
    }

    get = (n: number) => {
        this.#checkRange(n);
        return (this.#buffer[(n / 8) | 0] & (1 << (7 - (n % 8)))) > 0;
    }

    on = (n: number) => {
        this.#checkRange(n);
        this.#buffer[(n / 8) | 0] |= 1 << (7 - (n % 8));
    }

    off = (n: number) => {
        this.#checkRange(n);
        this.#buffer[(n / 8) | 0] &= ~(1 << (7 - (n % 8)));
    }

    toggle = (n: number) => {
        this.#checkRange(n);
        this.#buffer[(n / 8) | 0] ^= 1 << (7 - (n % 8));
    }

    writeBit = (value: boolean | number) => {
        if (value === true || value > 0) {
            this.on(this.#cursor);
        } else {
            this.off(this.#cursor);
        }
        this.#cursor++;
    }

    writeBitArray(value: (boolean | number)[]) {
        for (let v of value) {
            this.writeBit(v);
        }
    }

    writeUint = (value: number | BN, bitLength: number) => {
        let v = new BN(value);
        if (bitLength == 0 || (value.toString(2).length > bitLength)) {
            if (v.isZero()) {
                return;
            }
            throw Error(`bitLength is too small for a value ${v.toString()}. Got ${bitLength}, expected >= ${value.toString(2).length}`);
        }
        const s = v.toString(2, bitLength);
        for (let i = 0; i < bitLength; i++) {
            this.writeBit(s[i] === '1');
        }
    }

    writeInt = (value: number | BN, bitLength: number) => {
        let v = new BN(value);
        if (bitLength == 1) {
            if (v.eq(new BN(-1))) {
                this.writeBit(true);
                return;
            }
            if (v.isZero()) {
                this.writeBit(false);
                return;
            }
            throw Error(`bitlength is too small for a value ${v}`);
        } else {
            if (v.isNeg()) {
                this.writeBit(true);
                const b = new BN(2);
                const nb = b.pow(new BN(bitLength - 1));
                this.writeUint(nb.add(v), bitLength - 1);
            } else {
                this.writeBit(false);
                this.writeUint(v, bitLength - 1);
            }
        }
    }

    writeUint8 = (value: number) => {
        this.writeUint(value, 8);
    }

    writeVarUInt(value: BN | number, headerBits: number) {
        let v = new BN(value);
        if (v.eq(new BN(0))) {
            this.writeUint(0, headerBits);
        } else {
            let h = v.toString('hex');
            while (h.length % 2 !== 0) {
                h = '0' + h;
            }
            const l = Math.ceil((h.length) / 2);
            this.writeUint(l, headerBits);
            this.writeBuffer(Buffer.from(h, 'hex'));
        }
    }

    writeBuffer = (buffer: Buffer) => {
        for (let i = 0; i < buffer.length; i++) {
            this.writeUint8(buffer[i]);
        }
    }

    writeCoins = (amount: number | BN) => {
        if (amount == 0) {
            this.writeUint(0, 4);
        } else {
            amount = new BN(amount);
            const l = Math.ceil((amount.toString(16).length) / 2);
            this.writeUint(l, 4);
            this.writeUint(amount, l * 8);
        }
    }

    writeAddress = (address: Address | null) => {
        if (address === null) {
            this.writeUint(0, 2);
        } else {
            this.writeUint(2, 2);
            this.writeUint(0, 1);
            this.writeInt(address.workChain, 8);
            this.writeBuffer(address.hash);
        }
    }

    writeBitString = (value: BitString) => {
        for (let v of value) {
            this.writeBit(v);
        }
    }

    clone() {
        let buf = Buffer.alloc(this.#buffer.length);
        this.#buffer.copy(buf);
        return new BitString(buf, this.#length, this.#cursor);
    }

    toString() {
        let res = '';
        for (let v of this) {
            if (v) {
                res = res + '1';
            } else {
                res = res + '0';
            }
        }
        return res;
    }

    [inspectSymbol] = () => this.toFiftHex()

    toFiftHex(): string {
        if (this.cursor % 4 === 0) {
            const s = this.#buffer.slice(0, Math.ceil(this.cursor / 8)).toString('hex').toUpperCase();
            if (this.cursor % 8 === 0) {
                return s;
            } else {
                return s.substr(0, s.length - 1);
            }
        } else {
            const temp = this.clone();
            temp.writeBit(1);
            while (temp.cursor % 4 !== 0) {
                temp.writeBit(0);
            }
            const hex = temp.toFiftHex().toUpperCase();
            return hex + '_';
        }
    }

    static fromTopUppedArray(array: Buffer, fullfilledBytes = true) {
        const b = Buffer.alloc(array.length);
        const l = array.length * 8;
        let cur = l;
        array.copy(b);
        if (!fullfilledBytes && l > 0) {
            let foundEndBit = false;
            for (let c = 0; c < 7; c++) {
                cur--;
                if ((b[b.length-1] & (1 << c)) > 0) {
                    foundEndBit = true;
                    b[b.length-1] &= ~(1 << c);
                    break;
                }
            }
            if (!foundEndBit) {
                throw new Error("Incorrect TopUppedArray");
            }
        }
        return new BitString(b, l, cur);
    }

    getTopUppedLength() {
        return Math.ceil(this.cursor / 8);
    }

    writeTopUppedArray(b: Buffer, start: number = 0) {
        this.#buffer.copy(b, start);

        const len = this.getTopUppedLength();
        const tu = len * 8 - this.cursor;
        if (tu > 0) {
            const bit = 1 << (tu - 1);
            b[start+len-1] = (b[start+len-1] | bit) & (~(bit - 1));
        }
    }

    getTopUppedArray() {
        const ret = Buffer.alloc(this.getTopUppedLength());

        this.writeTopUppedArray(ret);

        return ret;
    }

    equals(src: BitString) {
        if (src.cursor !== this.cursor) {
            return false;
        }
        let sr = new BitStringReader(src);
        let tr = new BitStringReader(this);
        for (let i = 0; i < src.cursor; i++) {
            if (sr.readBit() !== tr.readBit()) {
                return false;
            }
        }
        return true;
    }

    //
    // Helpers
    //
    #checkRange(n: number) {
        if (n > this.length) {
            throw Error('Invalid index: ' + n);
        }
    }
}