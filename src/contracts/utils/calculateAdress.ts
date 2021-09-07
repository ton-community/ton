import { Address, Cell } from "../..";
import { StateInit } from "../../messages/StateInit";

export async function calculateAdress(workchain: number, code: Cell, data: Cell) {
    let cell = new Cell();
    let state = new StateInit({ code, data });
    state.writeTo(cell);
    let hash = await cell.hash();
    return new Address(workchain, hash);
}