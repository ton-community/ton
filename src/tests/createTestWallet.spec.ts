import { BN } from "bn.js";
import { fromNano } from "..";
import { awaitBalance } from "./awaitBalance";
import { createTestClient } from "./createTestClient";
import { createTestWallet } from "./createTestWallet";

describe('createTestWallet', () => {
    it('should create test wallet', async () => {
        const client = createTestClient();
        let testWallet = await createTestWallet(client, 0.001);
        await awaitBalance(client, testWallet.wallet.address, new BN(0));
        const balance = await client.getBalance(testWallet.wallet.address);
        expect(fromNano(balance)).toEqual('0.001');
    }, 60000);
});