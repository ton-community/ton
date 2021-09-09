import { TonClient } from "..";
import { awaitBalance } from "./awaitBalance";
import { openTestTreasure } from "./openTestTreasure";

export async function createTestWallet(client: TonClient, value: number) {
    let treasure = await openTestTreasure(client);
    const wallet = await client.createWallet();
    const seqno = await treasure.wallet.getSeqNo();
    await treasure.wallet.transfer({
        to: wallet.wallet.address,
        seqno: seqno,
        value: value,
        secretKey: treasure.secretKey
    });

    await awaitBalance(client, wallet.wallet.address, 0);

    return wallet;
}