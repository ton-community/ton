import { createTestClient } from "../tests/createTestClient";
import { openTestTreasure } from "../tests/openTestTreasure";

describe('TonWallet', () => {
    it('should throw on when trying to get seqno of unintitialized contract', async () => {
        const client = await createTestClient();
        const wallet = await client.createWallet();
        await expect(wallet.wallet.getSeqNo()).rejects.toThrowError();
    });

    it('should return valid seq no on initialized contract', async () => {
        const client = await createTestClient();
        let treasure = await openTestTreasure(client);
        let seqno = await treasure.wallet.getSeqNo();
        expect(seqno).toBeGreaterThan(5);
    });
});