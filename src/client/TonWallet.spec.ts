jest.setTimeout(20000);
import { Address } from "..";
import { createTestClient } from "../tests/createTestClient";
import { openTestTreasure } from "../tests/openTestTreasure";
import { delay } from "../utils/time";

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

    it('should trasnfer', async () => {
        const client = await createTestClient();
        let treasure = await openTestTreasure(client);
        let dest = Address.parseFriendly('EQClZ-KEDodcnyoyPX7c0qBBQ9QePzzquVwKuaqHk7F01825').address;
        let balance = await client.getBalance(dest);
        let seqno = await treasure.wallet.getSeqNo();
        await treasure.wallet.transfer({
            to: dest,
            value: 0.001,
            bounceable: false,
            seqno,
            secretKey: treasure.secretKey
        });
        while (true) {
            await delay(1000);
            if (await client.getBalance(dest) > balance) {
                break;
            }
        }
    });

    it('should trasnfer by stages', async () => {
        const client = await createTestClient();
        let treasure = await openTestTreasure(client);
        let dest = Address.parseFriendly('EQClZ-KEDodcnyoyPX7c0qBBQ9QePzzquVwKuaqHk7F01825').address;
        let balance = await client.getBalance(dest);

        // Prepare
        let prepared = await treasure.wallet.prepareTransfer({
            to: dest,
            value: 0.001,
            bounceable: false
        });

        // Sign
        let signed = await treasure.wallet.signTransfer(prepared, treasure.secretKey);

        // Send
        await treasure.wallet.sendTransfer(signed);

        while (true) {
            await delay(1000);
            if (await client.getBalance(dest) > balance) {
                break;
            }
        }
    });
});