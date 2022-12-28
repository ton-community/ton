import { Address, Cell } from "ton-core";
import { Contract } from "./Contract";
import { ContractProvider } from "./ContractProvider";

type MappedType<F> = {
    [P in keyof F]: P extends `${'get' | 'send'}${string}`
    ? (F[P] extends (x: ContractProvider, ...args: infer P) => infer R ? (...args: P) => R : never)
    : F[P];
}

export function open<T extends Contract>(src: T, factory: (params: { address: Address, init: { code: Cell, data: Cell } | null }) => ContractProvider): MappedType<T> {

    // Resolve parameters
    let address: Address;
    let init: { code: Cell, data: Cell } | null = null;

    if (!Address.isAddress(src.address)) {
        throw Error('Invalid address');
    }
    address = src.address;
    if (src.init) {
        if (!(src.init.code instanceof Cell)) {
            throw Error('Invalid init.code');
        }
        if (!(src.init.data instanceof Cell)) {
            throw Error('Invalid init.data');
        }
        init = src.init;
    }

    // Create executor
    let executor = factory({ address, init });

    // Create proxy
    return new Proxy<any>(src as any, {
        get(target, prop) {
            const value = target[prop];
            if (typeof prop === 'string' && (prop.startsWith('get') || prop.startsWith('send'))) {
                if (typeof value === 'function') {
                    return (...args: any[]) => value.apply(target, [executor, ...args]);
                }
            }
            return value;
        }
    }) as MappedType<T>;
}