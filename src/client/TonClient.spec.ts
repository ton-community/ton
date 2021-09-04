import { Address } from "../address/Address";
import { TonClient } from "./TonClient";

describe('TonClient', () => {
    it('should read balance', async () => {
        const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
        let balance = await client.getBalance('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO');
        expect(balance).toBe(0);
        balance = await client.getBalance(Address.parseFriendly('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO').address);
        expect(balance).toBe(0);
    });
});