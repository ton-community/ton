import { createTestClient } from "./createTestClient";
import { createTestWallet } from "./createTestWallet";

describe('createTestWallet', () => {
    it('should create test wallet', async () => {
        const client = createTestClient();
        let testWallet = await createTestWallet(client, 0.001);
        expect((await client.getBalance(testWallet.wallet.address))).toBeGreaterThanOrEqual(0.001);
    }, 20000);
});