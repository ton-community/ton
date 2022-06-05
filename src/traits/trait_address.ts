import { Address } from "../address/Address";
import { TupleSlice4 } from "../boc/TupleSlice4";
import { TonClient4 } from "../client/TonClient4";

export function address(client: TonClient4) {
    return async (seqno: number, address: Address, name: string) => {
        let executed = await client.runMethod(seqno, address, name);
        if (executed.exitCode !== 0 && executed.exitCode !== 1) {
            throw Error('Exit code: ' + executed.exitCode);
        }
        let parsed = new TupleSlice4(executed.result);
        return parsed.readAddress();
    };
}