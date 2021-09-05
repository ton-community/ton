import BN from 'bn.js';
import { Address } from '../address/Address';

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

    writeUint(value: number | BN, bitLength: number) {
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

    writeInt(value: number | BN, bitLength: number) {
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

    writeUint8(value: number) {
        this.writeUint(value, 8);
    }

    writeBuffer(buffer: Buffer) {
        for (let i = 0; i < buffer.length; i++) {
            this.writeUint8(buffer[i]);
        }
    }

    writeString(s: string) {
        for (let i = 0; i < s.length; i++) {
            this.writeUint8(s.charCodeAt(i));
        }
    }

    writeGrams(amount: number | BN) {
        if (amount == 0) {
            this.writeUint(0, 4);
        } else {
            amount = new BN(amount);
            const l = Math.ceil((amount.toString(16).length) / 2);
            this.writeUint(l, 4);
            this.writeUint(amount, l * 8);
        }
    }

    writeAddress(address: Address | null) {
        if (address === null) {
            this.writeUint(0, 2);
        } else {
            this.writeUint(2, 2);
            this.writeUint(0, 1);
            this.writeInt(address.workChain, 8);
            this.writeBuffer(address.hash);
        }
    }

    writeBitString(value: BitString) {
        for (let v of value) {
            this.writeBit(v);
        }
    }

    clone() {
        return new BitString(this.#buffer.slice(0), this.#length, this.#cursor);
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