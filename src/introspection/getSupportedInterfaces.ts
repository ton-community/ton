import { Address } from "../address/Address";
import { TupleSlice } from "../boc/TupleSlice";
import { TonClient } from "../client/TonClient";

//
// List of Known Interfaces
//

export type KnownInterface =
    | 'org.ton.introspection.v0'
    | 'com.tonwhales.nominators:v0';

const known: { [key: string]: KnownInterface } = {
    ['123515602279859691144772641439386770278']: 'org.ton.introspection.v0',
    ['256184278959413194623484780286929323492']: 'com.tonwhales.nominators:v0'
}

//
// Supported Interface reference
//

export type SupportedInterface = {
    type: 'known',
    name: KnownInterface
} | {
    type: 'unknown',
    value: string
}

/**
 * Fetching supported interfaces
 * @param src address
 * @param client client
 * @returns array of supported interfaces
 */
export async function getSupportedInterfaces(src: Address, client: TonClient): Promise<SupportedInterface[]> {
    // Query interfaces
    let res = await client.callGetMethodWithError(src, 'supported_interfaces');

    // If not successful: return empty
    if (res.exit_code !== 0 && res.exit_code !== 1) {
        return [];
    }

    try {
        let slice = new TupleSlice(res.stack);

        // First interface have to be introspection
        let firstNumber = slice.readBigNumber().toString();
        if (firstNumber !== '123515602279859691144772641439386770278') {
            return [];
        }

        // Read all remaining
        let interfaces: SupportedInterface[] = [];
        while (slice.remaining > 0) {
            let val = slice.readBigNumber().toString();
            let kn = known[val];
            if (kn) {
                interfaces.push({ type: 'known', name: kn });
            } else {
                interfaces.push({ type: 'unknown', value: val });
            }
        }
        return interfaces;
    } catch (e) {
        // In case of error: exit
        console.warn(e);
        return [];
    }
}