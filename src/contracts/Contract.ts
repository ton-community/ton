import { Address } from "..";
import { ContractSource } from "./sources/ContractSource";

export interface Contract {
    readonly address: Address;
    readonly source: ContractSource;
}