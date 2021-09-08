jest.setTimeout(20000);
import { Address, Cell } from "..";
import { awaitBalance } from "../tests/awaitBalance";
// import { WalletV3R1Source } from "../contracts/WalletV3R1Source";
// import { CommonMessageInfo } from "../messages/CommonMessageInfo";
// import { EmptyMessage } from "../messages/EmptyMessage";
// import { ExternalMessage } from "../messages/ExternalMessage";
// import { StateInit } from "../messages/StateInit";
import { createTestClient } from "../tests/createTestClient";
import { createTestWallet } from "../tests/createTestWallet";
import { openTestTreasure } from "../tests/openTestTreasure";
import { delay } from "../utils/time";
const tonweb = require('tonweb');
describe('TonWallet', () => {
    it('should throw on when trying to get seqno of unintitialized contract', async () => {
        const client = createTestClient();
        const wallet = await client.createWallet();
        await expect(wallet.wallet.getSeqNo()).rejects.toThrowError();
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
            value: 0.001,
            bounceable: false,
            seqno,
            secretKey: treasure.secretKey
        });
        await awaitBalance(client, dest, balance);
    });

    it('should trasnfer by stages', async () => {
        const client = createTestClient();
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

        // Await balance
        await awaitBalance(client, dest, balance);
    });

    // it('should deploy contracts', async () => {
    //     const client = createTestClient();
    //     const wallet = await createTestWallet(client, 0.01);
    //     await expect(wallet.wallet.getSeqNo()).rejects.toThrowError();
    //     const source = WalletV3R1Source.create({ workchain: wallet.wallet.address.workChain, publicKey: wallet.key.publicKey });
    //     expect(source.address.toString()).toEqual(wallet.wallet.address.toString());
    //     console.warn('Deploying ' + source.address.toFriendly());
    //     let w = new tonweb.Wallets();
    //     let ww = new w.default(client.rawClient.provider, { publicKey: new Uint8Array(wallet.key.publicKey), wc: 0 });
    //     let d = ww.deploy(new Uint8Array(wallet.key.secretKey));
    //     console.warn((await ww.getAddress()).toString(true, true, true));
    //     // console.warn((await d.getQuery()).print());

    //     // let res = new ExternalMessage({
    //     //     to: source.address,
    //     //     body: new CommonMessageInfo({
    //     //         stateInit: new StateInit({
    //     //             code: source.initialCode,
    //     //             data: source.initialData
    //     //         })
    //     //     })
    //     // });
    //     // let c = new Cell();
    //     // res.writeTo(c);
    //     // console.warn(c.toHex());

    //     await d.send();
    //     const rwallet = client.rawClient.wallet.create({ publicKey: new Uint8Array(wallet.key.publicKey), wc: 0 });
    //     // const seqno = await rwallet.methods.seqno().call(); 
    //     await rwallet.deploy(new Uint8Array(wallet.key.secretKey)).send();
    //     // console.warn((await rwallet.getAddress()).toString(true, true, true));
    //     // console.warn(seqno);

    //     // await rwallet.methods.transfer({
    //     //     secretKey: new Uint8Array(wallet.key.secretKey),
    //     //     toAddress: 'EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH',
    //     //     amount: tonweb.utils.toNano(0.001), // 0.01 Gram
    //     //     seqno: seqno,
    //     //     payload: 'Hello',
    //     //     sendMode: 3,
    //     // })

    //     while (true) {
    //         await delay(1000);
    //         if (await client.isContractDeployed(source.address)) {
    //             break;
    //         }
    //     }

    //     // let rawContract = new (new tonweb.Wallets()).default(client.rawClient.provider, { publicKey: wallet.key.publicKey });
    //     // let r = await rawContract.deploy();
    //     // console.warn(r);
    //     // await client.deployContract({ contract: source, await: true });
    //     // await expect(wallet.wallet.getSeqNo()).resolves.toBe(0);
    // });
});