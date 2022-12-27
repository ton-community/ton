import { Address, beginCell, Cell } from "ton-core";
import { StateInit } from "../messages/StateInit";

export function contractAddress(source: { workchain: number, initialCode: Cell, initialData: Cell }) {
    let builder = beginCell();
    let state = new StateInit({ code: source.initialCode, data: source.initialData });
    state.writeTo(builder);
    let hash = builder.endCell().hash();
    return new Address(source.workchain, hash);
}