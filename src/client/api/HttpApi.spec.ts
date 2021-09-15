import { BN } from "bn.js";
import { Address, Cell } from "../..";
import { CommonMessageInfo } from "../../messages/CommonMessageInfo";
import { ExternalMessage } from "../../messages/ExternalMessage";
import { HttpApi } from "./HttpApi";

describe('HttpApi', () => {
    it('should get balance', async () => {
        const api = new HttpApi('https://testnet.toncenter.com/api/v2/jsonRPC');
        let res = await api.getAddressInformation(Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address);
        expect(new BN(res.balance).gte(new BN(0))).toBe(true);
    });

    it('should get latest transactions', async () => {
        const api = new HttpApi('https://testnet.toncenter.com/api/v2/jsonRPC');
        const message = new ExternalMessage({
            to: Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address,
            body: new CommonMessageInfo()
        });
        const cell = new Cell();
        message.writeTo(cell);
        await api.sendBoc((await cell.toBoc({ idx: false })));
    });

    it('should get seqno', async () => {
        const api = new HttpApi('https://testnet.toncenter.com/api/v2/jsonRPC');
        let res = await api.callGetMethod(Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address, 'seqno', []);
        expect(res.exit_code).toBe(0);
    });
});