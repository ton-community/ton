import { Address } from "ton-core";
import { ContractSource } from "./sources/ContractSource";

export interface Contract {
    readonly address: Address;
}

export interface ContractWithSource extends Contract {
    readonly source: ContractSource;
}