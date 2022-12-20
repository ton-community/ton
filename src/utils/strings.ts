import { beginCell } from "../boc/Builder";
import { Cell } from "../boc/Cell";
import { Slice } from "../boc/Slice";

export function readString(slice: Slice) {

    // Check consistency
    if (slice.remaining % 8 !== 0) {
        throw new Error(`Invalid string length: ${slice.remaining}`);
    }
    if (slice.remainingRefs !== 0 && slice.remainingRefs !== 1) {
        throw new Error(`invalid number of refs: ${slice.remainingRefs}`);
    }
    if (slice.remainingRefs === 1 && slice.remaining > 7) {
        throw new Error(`invalid string length: ${slice.remaining}`);
    }

    // Read string
    let res = slice.readBuffer(slice.remaining / 8).toString();

    // Read tail
    if (slice.remainingRefs === 1) {
        res += readString(slice.readRef());
    }

    return res;
}

export function stringToCell(src: string): Cell {
    let builder = beginCell();
    if (src.length > 0) {
        if (src.length > 127) {
            let a = src.slice(0, 127);
            let t = src.slice(127);
            builder.storeBuffer(Buffer.from(a));
            builder.storeRef(stringToCell(t));
        } else {
            builder.storeBuffer(Buffer.from(src));
        }
    }
    return builder.endCell();
}