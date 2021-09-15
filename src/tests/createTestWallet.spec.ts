import { BN } from "bn.js";
import { toNano } from "..";
import { createTestClient } from "./createTestClient";
import { createTestWallet } from "./createTestWallet";

describe('createTestWallet', () => {
    it('should create test wallet', async () => {
        const client = createTestClient();
        let testWallet = await createTestWallet(client, 0.001);
        expect((await client.getBalance(testWallet.wallet.address)).gte(toNano(0.001))).toBe(true);
    }, 20000);
});