import { Cell, TupleReader } from "ton-core";

export interface ContractExecutor {
    getState(): Promise<{ balance: bigint, state: { kind: 'unint' } | { kind: 'active', state: { data: Buffer, code: Buffer } } | { kind: 'frozen' } }>;
    callGetMethod(name: string): Promise<{ gas: number, stack: TupleReader }>;
}