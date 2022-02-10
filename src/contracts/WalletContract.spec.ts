import { BN } from "bn.js";
import { mnemonicNew, mnemonicToWalletKey } from "ton-crypto";
import { SendMode, WalletSource } from "..";
import { CommonMessageInfo } from "../messages/CommonMessageInfo";
import { EmptyMessage } from "../messages/EmptyMessage";
import { InternalMessage } from "../messages/InternalMessage";
import { awaitBalance } from "../tests/awaitBalance";
import { awaitCondition } from "../tests/awaitCondition";
import { createTestClient } from "../tests/createTestClient";
import { openTestTreasure } from "../tests/openTestTreasure";
import { toNano } from "../utils/convert";
import { backoff } from "../utils/time";
// import { delay } from "../utils/time";
// import { WalletV1R1Source } from "./sources/WalletV1R1Source";
import { WalletV1R2Source } from "./sources/WalletV1R2Source";
import { WalletV1R3Source } from "./sources/WalletV1R3Source";
import { WalletV2R1Source } from "./sources/WalletV2R1Source";
import { WalletV2R2Source } from "./sources/WalletV2R2Source";
import { WalletV3R1Source } from "./sources/WalletV3R1Source";
import { WalletV3R2Source } from "./sources/WalletV3R2Source";
import { WalletContract } from "./WalletContract";

async function testSource(secretKey: Buffer, source: WalletSource) {
    const client = createTestClient();
    const treasure = await openTestTreasure(client);
    const contract = WalletContract.create(client, source);
    console.log('testing contract: ' + source.type + ' at ' + contract.address.toFriendly());
    let treasureSeqno = await backoff(() => treasure.wallet.getSeqNo(), false);
    await backoff(() => treasure.wallet.transfer({ to: contract.address, seqno: treasureSeqno, value: toNano(0.1), secretKey: treasure.secretKey, bounce: false }), false);
    console.log('awaiting transfer');
    await awaitBalance(client, contract.address, new BN(0));

    // Update seqno
    console.log('sending transaction');
    let seqno = await backoff(() => contract.getSeqNo(), false);
    expect(seqno).toBe(0);
    const transfer = contract.createTransfer({
        seqno,
        sendMode: 3,
        secretKey,
        order: new InternalMessage({
            to: treasure.wallet.address,
            value: toNano(0.05),
            bounce: true,
            body: new CommonMessageInfo({ body: new EmptyMessage() })
        })
    });
    await backoff(() => client.sendExternalMessage(contract, transfer), false);

    // Check seqno
    console.log('awaiting seqno');
    await awaitCondition(30000, async () => (await backoff(() => contract.getSeqNo(), false)) > 0);
}

describe('WalletContract', () => {

    // it('should work for v1r1 contract', async () => {
    //     let mnemonic = await mnemonicNew(24);
    //     let key = await mnemonicToWalletKey(mnemonic);
    //     await testSource(key.secretKey, WalletV1R1Source.create({ publicKey: key.publicKey, workchain: 0 }));
    // }, 60000);

    it('should work for v1r2 contract', async () => {
        let mnemonic = await mnemonicNew(24);
        let key = await mnemonicToWalletKey(mnemonic);
        await testSource(key.secretKey, WalletV1R2Source.create({ publicKey: key.publicKey, workchain: 0 }));
        await testSource(key.secretKey, WalletV1R2Source.create({ publicKey: key.publicKey, workchain: -1 }));
    }, 120000);

    it('should work for v1r3 contract', async () => {
        let mnemonic = await mnemonicNew(24);
        let key = await mnemonicToWalletKey(mnemonic);
        await testSource(key.secretKey, WalletV1R3Source.create({ publicKey: key.publicKey, workchain: 0 }));
        await testSource(key.secretKey, WalletV1R3Source.create({ publicKey: key.publicKey, workchain: -1 }));
    }, 120000);

    it('should work for v2r1 contract', async () => {
        let mnemonic = await mnemonicNew(24);
        let key = await mnemonicToWalletKey(mnemonic);
        await testSource(key.secretKey, WalletV2R1Source.create({ publicKey: key.publicKey, workchain: 0 }));
        await testSource(key.secretKey, WalletV2R1Source.create({ publicKey: key.publicKey, workchain: -1 }));
    }, 120000);

    it('should work for v2r2 contract', async () => {
        let mnemonic = await mnemonicNew(24);
        let key = await mnemonicToWalletKey(mnemonic);
        await testSource(key.secretKey, WalletV2R2Source.create({ publicKey: key.publicKey, workchain: 0 }));
        await testSource(key.secretKey, WalletV2R2Source.create({ publicKey: key.publicKey, workchain: -1 }));
    }, 120000);

    it('should work for v3r1 contract', async () => {
        let mnemonic = await mnemonicNew(24);
        let key = await mnemonicToWalletKey(mnemonic);
        await testSource(key.secretKey, WalletV3R1Source.create({ publicKey: key.publicKey, workchain: 0 }));
        await testSource(key.secretKey, WalletV3R1Source.create({ publicKey: key.publicKey, workchain: -1 }));
    }, 120000);

    it('should work for v3r2 contract', async () => {
        let mnemonic = await mnemonicNew(24);
        let key = await mnemonicToWalletKey(mnemonic);
        await testSource(key.secretKey, WalletV3R2Source.create({ publicKey: key.publicKey, workchain: 0 }));
        await testSource(key.secretKey, WalletV3R2Source.create({ publicKey: key.publicKey, workchain: -1 }));
    }, 120000);
});