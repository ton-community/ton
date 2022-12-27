import { Address } from "ton-core";
import { Contract } from "./Contract";
import { ContractExecutor } from "./ContractExecutor";

type MappedType<F> = {
    [P in keyof F]: P extends `get${string}`
    ? (F[P] extends (x: ContractExecutor, ...args: infer P) => infer R ? (...args: P) => R : never)
    : F[P];
}

export function open<T extends Contract>(src: T, executor: ContractExecutor): MappedType<T> {

    // Check parameters
    if (!Address.isAddress(src.address)) {
        throw Error('Invalid address');
    }

    return new Proxy<any>(src as any, {
        get(target, prop) {
            const value = target[prop];
            if (typeof prop === 'string' && prop.startsWith('get')) {
                if (typeof value === 'function') {
                    return (...args: any[]) => value.apply(target, [executor, ...args]);
                }
            }
            return value;
        }
    }) as MappedType<T>;
    // return new Proxy(src, {
    //     get(target, prop) {
    //         const value = target[prop];
    //         if (typeof value === 'function') {
    //             return (...args: any[]) => value.apply(target, args);
    //         }
    //         return value;
    //     },
    // });
}