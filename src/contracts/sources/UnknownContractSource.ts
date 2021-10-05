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
    readonly description: string;

    constructor(type: string, workchain: number, description: string) {
        this.type = type;
        this.workchain = workchain;
        this.description = description;
    }

    backup = () => {
        throw Error('Unknown');
    }

    describe = () => {
        return this.description;
    }
}