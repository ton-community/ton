import { beginCell, Builder, Cell, Slice } from "ton-core";


function readBuffer(slice: Slice) {
    // Check consistency
    if (slice.remainingBits % 8 !== 0) {
        throw new Error(`Invalid string length: ${slice.remainingBits}`);
    }
    if (slice.remainingRefs !== 0 && slice.remainingRefs !== 1) {
        throw new Error(`invalid number of refs: ${slice.remainingRefs}`);
    }
    if (slice.remainingRefs === 1 && (1023 - slice.remainingBits) > 7) {
        throw new Error(`invalid string length: ${slice.remainingBits / 8}`);
    }

    // Read string
    let res = slice.loadBuffer(slice.remainingBits / 8);

    // Read tail
    if (slice.remainingRefs === 1) {
        res = Buffer.concat([res, readBuffer(slice.loadRef().beginParse())]);
    }

    return res;
}

export function readString(slice: Slice) {
    return readBuffer(slice).toString();
}

function writeBuffer(src: Buffer, builder: Builder) {
    if (src.length > 0) {
        let bytes = Math.floor(builder.availableBits / 8);
        if (src.length > bytes) {
            let a = src.slice(0, bytes);
            let t = src.slice(bytes);
            builder = builder.storeBuffer(a);
            let bb = beginCell();
            writeBuffer(t, bb);
            builder = builder.storeRef(bb.endCell());
        } else {
            builder = builder.storeBuffer(src);
        }
    }
}

export function stringToCell(src: string): Cell {
    let builder = beginCell();
    writeBuffer(Buffer.from(src), builder);
    return builder.endCell();
}

export function writeString(src: string, builder: Builder) {
    writeBuffer(Buffer.from(src), builder);
}