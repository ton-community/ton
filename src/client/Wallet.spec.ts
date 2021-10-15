import { Address } from "..";
import { awaitBalance } from "../tests/awaitBalance";
import { createTestClient } from "../tests/createTestClient";
import { openTestTreasure } from "../tests/openTestTreasure";
import { toNano } from "../utils/convert";

describe('Wallet', () => {
    it('should return zero when trying to get seqno of unintitialized contract', async () => {
        const client = createTestClient();
        const wallet = await client.createNewWallet({ workchain: 0 });
        expect(await wallet.wallet.getSeqNo()).toBe(0);
    });

    it('should return valid seqno on initialized contract', async () => {
        const client = createTestClient();
        let treasure = await openTestTreasure(client);
        let seqno = await treasure.wallet.getSeqNo();
        expect(seqno).toBeGreaterThan(5);
    });

    it('should trasnfer', async () => {
        const client = createTestClient();
        let treasure = await openTestTreasure(client);
        let dest = Address.parseFriendly('EQClZ-KEDodcnyoyPX7c0qBBQ9QePzzquVwKuaqHk7F01825').address;
        let balance = await client.getBalance(dest);
        let seqno = await treasure.wallet.getSeqNo();
        await treasure.wallet.transfer({
            to: dest,
            value: toNano(0.05),
            bounce: false,
            seqno,
            secretKey: treasure.secretKey
        });
        await awaitBalance(client, dest, balance);
    }, 60000);

    it('should trasnfer with comment', async () => {
        const client = createTestClient();
        let treasure = await openTestTreasure(client);
        let dest = Address.parseFriendly('EQClZ-KEDodcnyoyPX7c0qBBQ9QePzzquVwKuaqHk7F01825').address;
        let balance = await client.getBalance(dest);
        let seqno = await treasure.wallet.getSeqNo();
        await treasure.wallet.transfer({
            to: dest,
            value: toNano(0.05),
            bounce: false,
            seqno,
            secretKey: treasure.secretKey,
            payload: 'Hello World!'
        });
        await awaitBalance(client, dest, balance);
    }, 60000);

    it('should trasnfer by stages', async () => {
        const client = createTestClient();
        let treasure = await openTestTreasure(client);
        let dest = Address.parseFriendly('EQClZ-KEDodcnyoyPX7c0qBBQ9QePzzquVwKuaqHk7F01825').address;
        let balance = await client.getBalance(dest);

        // Prepare
        let seqno = await treasure.wallet.getSeqNo();

        // Sign
        let signed = await treasure.wallet.transferSign({
            to: dest,
            bounce: false,
            value: toNano(0.05),
            seqno,
            secretKey: treasure.secretKey
        });

        // Send
        await treasure.wallet.prepare(0, treasure.publicKey, 'org.ton.wallets.v3');
        await treasure.wallet.transferCommit(signed);

        // Await balance
        await awaitBalance(client, dest, balance);
    }, 60000);
});