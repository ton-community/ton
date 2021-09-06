import BN from "bn.js";
const TonWeb = require('tonweb');

export function toNano(src: number) {
    return TonWeb.utils.toNano(src) as BN;
}

export function fromNano(src: BN | number | string) {
    return parseFloat(TonWeb.utils.fromNano(src) as string);
}