import { base32Encode } from "../utils/base32";
import { ADNLAddress } from "./ADNLAddress";

describe('ADNLAddress', () => {
    it('should handle address', () => {
        const address = ADNLAddress.parseFriendly('vcqmha5j3ceve35ammfrhqty46rkhi455otydstv66pk2tmf7rl25f3');
        expect(address.toFriendly()).toEqual('vcqmha5j3ceve35ammfrhqty46rkhi455otydstv66pk2tmf7rl25f3');
        expect(address.toString()).toEqual('vcqmha5j3ceve35ammfrhqty46rkhi455otydstv66pk2tmf7rl25f3');
        expect(address.toRaw()).toEqual('45061C1D4EC44A937D0318589E13C73D151D1CEF5D3C0E53AFBCF56A6C2FE2BD');
        expect(address.address).toEqual(Buffer.from('45061C1D4EC44A937D0318589E13C73D151D1CEF5D3C0E53AFBCF56A6C2FE2BD', 'hex'));
    });
});