import { Address, Cell } from "../..";
import { StateInit } from "../../messages/StateInit";

export interface ContractSource {
    initialCode: Cell;
    initialData: Cell;
    workchain: number;
    type: string;
    backup(): string;
    describe(): string;
}

export async function contractAddress(source: ContractSource) {
    let cell = new Cell();
    let state = new StateInit({ code: source.initialCode, data: source.initialData });
    state.writeTo(cell);
    let hash = await cell.hash();
    return new Address(source.workchain, hash);
}