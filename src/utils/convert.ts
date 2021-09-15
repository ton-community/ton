import BN from "bn.js";
const ethUnit = require('ethjs-unit');

export function toNano(src: number | string | BN) {
    return ethUnit.toWei(src, 'gwei') as BN;
}

export function fromNano(src: BN | number | string) {
    return ethUnit.fromWei(src, 'gwei') as string;
}