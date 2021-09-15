import { BN } from "bn.js";
import { TonClient } from "..";
import { toNano } from "../utils/convert";
import { awaitBalance } from "./awaitBalance";
import { openTestTreasure } from "./openTestTreasure";

export async function createTestWallet(client: TonClient, value: number) {
    let treasure = await openTestTreasure(client);
    const wallet = await client.createNewWallet({ workchain: 0 });
    const seqno = await treasure.wallet.getSeqNo();
    await treasure.wallet.transfer({
        to: wallet.wallet.address,
        seqno: seqno,
        bounce: false,
        value: toNano(value),
        secretKey: treasure.secretKey
    });

    await awaitBalance(client, wallet.wallet.address, new BN(0));

    return wallet;
}