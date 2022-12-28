import { randomTestKey } from "../utils/randomTestKey";
import { WalletContractV4 } from "./WalletContractV4";
import { createTestClient4 } from "../utils/createTestClient4";
import { Address, CommentMessage, CommonMessageInfo, InternalMessage, SendMode, toNano } from "ton-core";

describe('WalletContractV4', () => {
    it('should has balance and correct address', async () => {

        // Create contract
        let client = createTestClient4();
        let key = randomTestKey('v4-treasure');
        let contract = client.open(WalletContractV4.create({ workchain: 0, publicKey: key.publicKey }));
        let balance = await contract.getBalance();

        // Check parameters
        expect(contract.address.equals(Address.parse('EQDnBF4JTFKHTYjulEJyNd4dstLGH1m51UrLdu01_tw4z2Au'))).toBe(true);
        expect(balance > 0n).toBe(true);
    });
    it('should perform transfer', async () => {
        // Create contract
        let client = createTestClient4();
        let key = randomTestKey('v4-treasure');
        let contract = client.open(WalletContractV4.create({ workchain: 0, publicKey: key.publicKey }));

        // Prepare transfer
        let seqno = await contract.getSeqno();
        let transfer = contract.createTransfer({
            seqno,
            sendMode: SendMode.NONE,
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