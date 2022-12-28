import { randomTestKey } from "../tests/randomTestKey";
import { createTestClient4 } from "../tests/createTestClient4";
import { Address, CommentMessage, CommonMessageInfo, InternalMessage, toNano } from "ton-core";
import { WalletContractV2R2 } from "./WalletContractV2R2";

describe('WalletContractV2R2', () => {
    it('should has balance and correct address', async () => {

        // Create contract
        let client = createTestClient4();
        let key = randomTestKey('v4-treasure');
        let contract = client.open(WalletContractV2R2.create({ workchain: 0, publicKey: key.publicKey }));
        let balance = await contract.getBalance();

        // Check parameters
        expect(contract.address.equals(Address.parse('EQAkAcNLtzCHudScK9Hsk9I_7SrunBWf_9VrA2xJmGebwEsl'))).toBe(true);
        expect(balance > 0n).toBe(true);
    });
    it('should perform transfer', async () => {
        // Create contract
        let client = createTestClient4();
        let key = randomTestKey('v4-treasure');
        let contract = client.open(WalletContractV2R2.create({ workchain: 0, publicKey: key.publicKey }));

        // Prepare transfer
        let seqno = await contract.getSeqno();
        let transfer = contract.createTransfer({
            seqno,
            sendMode: 0,
            secretKey: key.secretKey,
            order: new InternalMessage({
                bounce: true,
                to: Address.parse('kQD6oPnzaaAMRW24R8F0_nlSsJQni0cGHntR027eT9_sgtwt'),
                value: toNano('0.1'),
                body: new CommonMessageInfo({ body: new CommentMessage('Hello, world!') })
            })
        });

        // Perform transfer
        await contract.send(transfer);
    });
});