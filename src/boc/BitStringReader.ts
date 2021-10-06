import { BN } from "bn.js";
import { BitString } from "..";

export class BitStringReader {

    private buffer: Buffer;
    private length: number;
    private offset = 0;

    constructor(string: BitString) {
        let r = Buffer.alloc(string.buffer.length);
        string.buffer.copy(r);
        this.buffer = r;
        this.length = string.cursor;
    }

    readUint(bits: number) {
        if (bits == 0) {
            return new BN(0);
        }

        let res = '';
        for (let i = 0; i < bits; i++) {
            res += this.readBit() ? '1' : '0';
        }
        return new BN(res, 2);
    }

    readUintNumber(bits: number) {
        return this.readUint(bits).toNumber();
    }

    readBit() {
        let r = this.getBit(this.offset);
        this.offset++;
        return r;
    }

    readUnaryLength() {
        let res = 0;
        while (this.readBit()) {
            res++;
        }
        return res;
    }

    readRemaining() {
        let res = BitString.alloc(1023);
        while (this.offset < this.length) {
            res.writeBit(this.readBit());
        }
        return res;
    }

    private getBit(n: number) {
        if (n >= this.length || n < 0) {
            throw Error('Out of range');
        }
        return (this.buffer[(n / 8) | 0] & (1 << (7 - (n % 8)))) > 0;
    }
}