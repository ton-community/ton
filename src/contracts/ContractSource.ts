import { Address, Cell } from "..";

export type ContractSource = {
    address: Address;
    initialCode: Cell;
    initialData: Cell;
    type: string;
}