import { Cell } from "ton-core";
import { parseSupportedMessage } from "./parseSupportedMessage";

describe('parseSupportedMessage', () => {
    it('should parse jetton cashback message', () => {
        const parsed = parseSupportedMessage('org.ton.jetton.wallet.v1', Cell.fromBoc(Buffer.from('te6cckEBAQEADgAAGNUydtsAAAAAAAAAAPfBmNw=', 'base64'))[0]);
        expect(parsed!.type).toEqual('jetton::excesses');
    });
    it('should parse jetton transfer message', () => {
        const parsed = parseSupportedMessage('org.ton.jetton.wallet.v1', Cell.fromBoc(Buffer.from('te6cckEBAQEAWAAArA+KfqUAAAAAAAAAACJxCAB860VNnJjzOWYUnx1yH/9dlDhACmJc4Y9le+MW/mPQtQAqOlU+tx9byiU4lKOluDPEa01EQspOTHW6LLi+WrhKqcgL68IA1dgR7g==', 'base64'))[0]);
        expect(parsed!.type).toEqual('jetton::transfer');
    });
    it('should parse jetton cashback message', () => {
        const parsed = parseSupportedMessage('org.ton.jetton.wallet.v1', Cell.fromBoc(Buffer.from('te6cckEBAQEAMgAAYHNi0JwAAAAAAAAAACJxCAFR0qn1uPreUSnEpR0twZ4jWmoiFlJyY63RZcXy1cJVTsZK1qQ=', 'base64'))[0]);
        expect(parsed!.type).toEqual('jetton::transfer_notification');
    });
});