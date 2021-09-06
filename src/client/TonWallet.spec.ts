jest.setTimeout(15000);
import { createTestClient } from "../tests/createTestClient";
import { createTestWallet } from "../tests/createTestWallet";

describe('TonWallet', () => {
    it('should create test wallet', async () => {
        const client = await createTestClient();
        const wallet = await createTestWallet(client, 0.001);
        expect(await wallet.wallet.getBalance()).toBeGreaterThan(0);
    });
});