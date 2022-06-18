import BN from "bn.js";
import { beginCell, Builder } from "../boc/Builder";
import { Cell } from "../boc/Cell";
import { Slice } from "../boc/Slice";

const INT64_MIN = new BN('-9223372036854775808');
const INT64_MAX = new BN('9223372036854775807');

export type StackNull = { type: 'null' };
export type StackInt = { type: 'int', value: BN };
export type StackNaN = { type: 'nan' };
export type StackCell = { type: 'cell', cell: Cell };
export type StackSlice = { type: 'slice', cell: Cell };
export type StackBuilder = { type: 'builder', cell: Cell };
export type StackTuple = { type: 'tuple', items: StackItem[] };
export type StackItem = StackNull | StackInt | StackNaN | StackCell | StackSlice | StackBuilder | StackTuple;

// vm_stk_null#00 = VmStackValue;
// vm_stk_tinyint#01 value:int64 = VmStackValue;
// vm_stk_int#0201_ value:int257 = VmStackValue;
// vm_stk_nan#02ff = VmStackValue;
// vm_stk_cell#03 cell:^Cell = VmStackValue;

//_ cell:^Cell st_bits:(## 10) end_bits:(## 10) { st_bits <= end_bits }
//   st_ref:(#<= 4) end_ref:(#<= 4) { st_ref <= end_ref } = VmCellSlice;
// vm_stk_slice#04 _:VmCellSlice = VmStackValue;
// vm_stk_builder#05 cell:^Cell = VmStackValue;
// vm_stk_cont#06 cont:VmCont = VmStackValue;

// vm_tupref_nil$_ = VmTupleRef 0;
// vm_tupref_single$_ entry:^VmStackValue = VmTupleRef 1;
// vm_tupref_any$_ {n:#} ref:^(VmTuple (n + 2)) = VmTupleRef (n + 2);
// vm_tuple_nil$_ = VmTuple 0;
// vm_tuple_tcons$_ {n:#} head:(VmTupleRef n) tail:^VmStackValue = VmTuple (n + 1);
// vm_stk_tuple#07 len:(## 16) data:(VmTuple len) = VmStackValue;

function serializeStackItem(src: StackItem, builder: Builder) {
    if (src.type === 'null') {
        builder.storeUint8(0x00);
    } else if (src.type === 'int') {
        if (src.value.lte(INT64_MAX) && src.value.gte(INT64_MIN)) {
            builder.storeUint8(0x01);
            builder.storeInt(src.value, 64);
        } else {
            builder.storeUint(0x0100, 15);
            builder.storeInt(src.value, 257);
        }
    } else if (src.type === 'nan') {
        builder.storeInt(0x02ff, 16);
    } else if (src.type === 'cell') {
        builder.storeUint8(0x03);
        builder.storeRef(src.cell);
    } else if (src.type === 'slice') {
        builder.storeUint8(0x04);
        builder.storeUint(0, 10);
        builder.storeUint(src.cell.bits.cursor, 10);
        builder.storeUint(0, 3);
        builder.storeUint(src.cell.refs.length, 3);
        builder.storeRef(src.cell);
    } else if (src.type === 'builder') {
        builder.storeUint8(0x05);
        builder.storeRef(src.cell);
    } else if (src.type === 'tuple') {
        let head: Cell | null = null;
        let tail: Cell | null = null;
        for (let i = 0; i < src.items.length; i++) {

            // Swap
            let s: Cell | null = head;
            head = tail;
            tail = s;

            if (i > 1) {
                head = beginCell()
                    .storeRef(tail!)
                    .storeRef(head!)
                    .endCell();
            }

            let bc = beginCell();
            serializeStackItem(src.items[i], bc);
            tail = bc.endCell();
        }

        builder.storeUint8(0x07);
        builder.storeUint(src.items.length, 16);
        if (head) {
            builder.storeRef(head);
        }
        if (tail) {
            builder.storeRef(tail);
        }
    } else {
        throw Error('Invalid value');
    }
}

function parseStackItem(cs: Slice): StackItem {
    let kind = cs.readUintNumber(8);
    if (kind === 0) {
        return { type: 'null' };
    } else if (kind === 1) {
        return { type: 'int', value: cs.readInt(64) }
    } else if (kind === 2) {
        if (cs.readUintNumber(7) === 0) {
            return { type: 'int', value: cs.readInt(257) }
        } else {
            cs.readBit(); // must eq 1
            return { type: 'nan' };
        }
    } else if (kind === 3) {
        return { type: 'cell', cell: cs.readCell() };
    } else if (kind === 4) {
        let startBits = cs.readUintNumber(10);
        let endBits = cs.readUintNumber(10);
        let startRefs = cs.readUintNumber(3);
        let endRefs = cs.readUintNumber(3);

        // Copy to new cell
        let rs = cs.readCell().beginParse();
        rs.skip(startBits);
        let dt = rs.readBitString(endBits - startBits);
        let cell = new Cell('ordinary', dt);

        // Copy refs if exist
        if (startRefs < endRefs) {
            for (let i = 0; i < startRefs; i++) {
                cs.readCell();
            }
            for (let i = 0; i < endRefs - startRefs; i++) {
                cell.refs.push(cs.readCell());
            }
        }

        return { type: 'slice', cell };
    } else if (kind === 5) {
        return { type: 'builder', cell: cs.readCell() };
    } else if (kind === 7) {
        let length = cs.readUintNumber(16);
        let items: StackItem[] = [];
        if (length > 1) {
            let head: Slice = cs.readRef();
            let tail: Slice = cs.readRef();
            items.unshift(parseStackItem(tail));
            for (let i = 0; i < length - 2; i++) {
                let ohead = head;
                head = ohead.readRef();
                tail = ohead.readRef();
                items.unshift(parseStackItem(tail));
            }
            items.unshift(parseStackItem(head));
        } else if (length === 1) {
            items.push(parseStackItem(cs.readRef()));
        }
        return { type: 'tuple', items };
    } else {
        throw Error('Unsupported stack item')
    }
}

//
// Stack parsing
// Source: https://github.com/ton-foundation/ton/blob/ae5c0720143e231c32c3d2034cfe4e533a16d969/crypto/block/block.tlb#L783
//
// vm_stack#_ depth:(## 24) stack:(VmStackList depth) = VmStack;
// vm_stk_cons#_ {n:#} rest:^(VmStackList n) tos:VmStackValue = VmStackList (n + 1);
// vm_stk_nil#_ = VmStackList 0;
//

function serializeStackTail(src: StackItem[], builder: Builder) {
    if (src.length > 0) {

        // rest:^(VmStackList n)
        let tail = beginCell();
        serializeStackTail(src.slice(0, src.length - 1), tail);
        builder.storeRef(tail.endCell());

        // tos
        serializeStackItem(src[src.length - 1], builder);
    }
}

export function serializeStack(src: StackItem[]) {
    let builder = beginCell();
    builder.storeUint(src.length, 24);
    let r = [...src];
    serializeStackTail(r, builder);
    return builder.endCell();
}

export function parseStack(src: Cell): StackItem[] {
    let res: StackItem[] = [];
    let cs = src.beginParse();
    let size = cs.readUintNumber(24);
    for (let i = 0; i < size; i++) {
        let next = cs.readRef();
        res.unshift(parseStackItem(cs));
        cs = next;
    }
    return res;
}