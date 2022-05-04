import { Cell } from "../boc/Cell";
import { parseSupportedMessage } from "./parseSupportedMessage";

describe('parseSupportedMessage', () => {
    it('should parse jetton notification message', () => {
        const parsed = parseSupportedMessage('org.ton.jetton.wallet.v1', Cell.fromBoc(Buffer.from('te6cckEBAQEADgAAGNUydtsAAAAAAAAAAPfBmNw=', 'base64'))[0]);
        expect(parsed!.type).toEqual('jetton::excesses')
    });
});