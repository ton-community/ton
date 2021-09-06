import { TonClient } from "..";
import { delay } from "../utils/time";
import { openTestTreasure } from "./openTestTreasure";

export async function createTestWallet(client: TonClient, amount: number) {
    let treasure = await openTestTreasure(client);
    const wallet = await client.createWallet();
    const seqno = await treasure.wallet.getSeqNo();
    await treasure.wallet.transfer({
        to: wallet.wallet.address,
        seqno: seqno,
        amount: amount,
        secretKey: treasure.secretKey,
        bounceable: false
    });
    while (true) {
        await delay(1000);
        let balance = await wallet.wallet.getBalance();
        console.warn(balance);
        if (balance > 0) {
            break;
        }
    }
    return wallet;
}