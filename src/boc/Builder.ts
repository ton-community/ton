import BN from "bn.js";
import { Address } from "../address/Address";
import { BitString } from "./BitString";
import { Cell } from "./Cell";

export class Builder {
    private bits = BitString.alloc(1023);
    private refs: Cell[] = [];
    private ended = false;

    storeRef = (src: Cell) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.refs.push(src);
        return this;
    }

    storeBit = (value: boolean | number) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeBit(value);
        return this;
    }

    storeBitArray = (value: (boolean | number)[]) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeBitArray(value);
        return this;
    }

    storeUint = (value: number | BN, bitLength: number) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeUint(value, bitLength);
        return this;
    }

    storeInt = (value: number | BN, bitLength: number) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeInt(value, bitLength);
        return this;
    }

    storeUint8 = (value: number) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeUint8(value);
        return this;
    }

    storeVarUint = (value: number | BN, bitLength: number) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeVarUInt(value, bitLength);
        return this;
    }

    storeBuffer = (buffer: Buffer) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeBuffer(buffer);
        return this;
    }

    storeCoins = (amount: number | BN) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeCoins(amount);
        return this;
    }

    storeAddress = (address: Address | null) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeAddress(address);
        return this;
    }

    storeBitString = (value: BitString) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.bits.writeBitString(value);
        return this;
    }

    storeDict = (src: Cell | null) => {
        if (this.ended) {
            throw Error('Already ended')
        }
        if (src) {
            this.bits.writeBit(true);
            this.refs.push(src);
        } else {
            this.bits.writeBit(false);
        }
        return this;
    }

    storeRefMaybe = (src: Cell | null) => {
        return this.storeDict(src);
    }

    endCell() {
        if (this.ended) {
            throw Error('Already ended')
        }
        this.ended = true;
        let res = new Cell('ordinary', this.bits);
        for (let r of this.refs) {
            res.refs.push(r);
        }
        return res;
    }
}

export function beginCell() {
    return new Builder();
}