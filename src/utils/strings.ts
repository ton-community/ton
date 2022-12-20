import { beginCell } from "../boc/Builder";
import { Cell } from "../boc/Cell";
import { Slice } from "../boc/Slice";

function readBuffer(slice: Slice) {
    // Check consistency
    if (slice.remaining % 8 !== 0) {
        throw new Error(`Invalid string length: ${slice.remaining}`);
    }
    if (slice.remainingRefs !== 0 && slice.remainingRefs !== 1) {
        throw new Error(`invalid number of refs: ${slice.remainingRefs}`);
    }
    if (slice.remainingRefs === 1 && (1023 - slice.remaining) > 7) {
        throw new Error(`invalid string length: ${slice.remaining / 8}`);
    }

    // Read string
    let res = slice.readBuffer(slice.remaining / 8);

    // Read tail
    if (slice.remainingRefs === 1) {
        res = Buffer.concat([res, readBuffer(slice.readRef())]);
    }

    return res;
}

export function readString(slice: Slice) {
    return readBuffer(slice).toString();
}

function bufferToCell(src: Buffer): Cell {
    let builder = beginCell();
    if (src.length > 0) {
        if (src.length > 127) {
            let a = src.slice(0, 127);
            let t = src.slice(127);
            builder = builder.storeBuffer(a);
            builder = builder.storeRef(bufferToCell(t));
        } else {
            builder = builder.storeBuffer(src);
        }
    }
    return builder.endCell();
}

export function stringToCell(src: string): Cell {
    return bufferToCell(Buffer.from(src));
}