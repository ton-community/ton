import { Cell } from "../..";
import { ContractSource } from "./ContractSource";

export class UnknownContractSource implements ContractSource {
    get initialCode(): Cell {
        throw Error('Unknown');
    }
    get initialData(): Cell {
        throw Error('Unknown');
    }
    readonly workchain: number;
    readonly type: string;

    constructor(type: string, workchain: number) {
        this.type = type;
        this.workchain = workchain;
    }
}