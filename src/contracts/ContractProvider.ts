import { TupleItem, TupleReader, Message } from "ton-core";

export interface ContractProvider {
    getState(): Promise<{ balance: bigint, data: Buffer | null, code: Buffer | null, state: 'unint' | 'active' | 'frozen' }>;
    callGetMethod(name: string, args: TupleItem[]): Promise<{ stack: TupleReader }>;
    send(message: Message): Promise<void>;
}