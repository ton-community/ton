import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient } from "..";
import { delay } from "../utils/time";

// If tests are failing, please full this wallet with more coins
const testWallet = 'EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH';
const testWalletMnemonics = [
    'circle', 'task', 'moral',
    'disagree', 'echo', 'kingdom',
    'agent', 'kite', 'love',
    'indoor', 'manage', 'orphan',
    'royal', 'business', 'whisper',
    'saddle', 'sun', 'dog',
    'street', 'cart', 'flash',
    'cheese', 'swift', 'turkey'
];

export async function createTestWallet(client: TonClient, amount: number) {
    const key = await mnemonicToWalletKey(testWalletMnemonics);
    const testWallet = await client.openWallet(key.publicKey);
    const wallet = await client.createWallet();
    const seqno = await testWallet.getSeqNo();
    console.warn(seqno);
    await testWallet.transfer({
        to: wallet.wallet.address,
        seqno: seqno,
        amount: amount,
        secretKey: wallet.key.secretKey
    });
    console.warn(wallet.wallet.address.toFriendly());
    while (true) {
        await delay(1000);
        if (await wallet.wallet.getBalance() > 0) {
            break;
        }
    }
    return wallet;
}