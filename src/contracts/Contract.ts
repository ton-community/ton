import { Address, Cell } from "ton-core";

export interface Contract {
    readonly address: Address;
    readonly init?: { code: Cell, data: Cell } | null | undefined;
}