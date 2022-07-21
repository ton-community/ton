import { BitString } from "../boc/BitString";

export class AddressExternal {
    readonly bits: BitString;
    constructor(bits: BitString) {
        this.bits = bits;
    }
}