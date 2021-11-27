import { BN } from "bn.js";
import { Address, BitString } from "..";

export class BitStringReader {

    private buffer: Buffer;
    private length: number;
    private offset = 0;

    get currentOffset() {
        return this.offset;
    }

    constructor(string: BitString) {
        let r = Buffer.alloc(string.buffer.length);
        string.buffer.copy(r);
        this.buffer = r;
        this.length = string.cursor;
    }

    skip(bits: number) {
        for (let i = 0; i < bits; i++) {
            this.readBit();
        }
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

    readBuffer(size: number) {
        let res: number[] = [];
        for (let i = 0; i < size; i++) {
            res.push(this.readUintNumber(8));
        }
        return Buffer.from(res);
    }

    readBit() {
        let r = this.getBit(this.offset);
        this.offset++;
        return r;
    }

    readCoins() {
        let bytes = this.readUintNumber(4);
        if (bytes === 0) {
            return new BN(0);
        }
        return new BN(this.readBuffer(bytes).toString('hex'), 'hex');
    }

    readVarUInt(headerBits: number) {
        let bytes = this.readUintNumber(headerBits);
        if (bytes === 0) {
            return new BN(0);
        }
        return new BN(this.readBuffer(bytes).toString('hex'), 'hex');
    }

    readVarUIntNumber(headerBits: number) {
        return this.readVarUInt(headerBits).toNumber();
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

    readAddress() {
        let type = this.readUintNumber(2);
        if (type === 0) {
            return null;
        }
        if (type !== 2) {
            throw Error('Only STD address supported')
        }
        if (this.readUintNumber(1) !== 0) {
            throw Error('Only STD address supported')
        }

        const wc = this.readUintNumber(8);
        const hash = this.readBuffer(32);
        return new Address(wc, hash);
    }

    private getBit(n: number) {
        if (n >= this.length || n < 0) {
            throw Error('Out of range');
        }
        return (this.buffer[(n / 8) | 0] & (1 << (7 - (n % 8)))) > 0;
    }
}