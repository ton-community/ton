import { TonClient } from "..";
import { delay } from "../utils/time";
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
    while (true) {
        await delay(1000);
        let balance = await wallet.wallet.getBalance();
        if (balance > 0) {
            break;
        }
    }
    return wallet;
}