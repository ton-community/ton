import { BN } from "bn.js";
import { mnemonicToWalletKey } from "ton-crypto";
import { Address } from "../address/Address";
import { createTestClient } from "../tests/createTestClient";
import { TonClient } from "./TonClient";
// import { TonTransaction } from "./TonTransaction";

describe('TonClient', () => {
    it('should read balance', async () => {
        const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
        const address = Address.parseFriendly('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO');
        let balance = (await client.getBalance(address.address));
        expect(balance.eq(new BN(0))).toBe(true);
        balance = (await client.getBalance(Address.parseFriendly('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO').address));
        expect(balance.eq(new BN(0))).toBe(true);
    });

    it('should use workchain 0 when load from mnemonics', async () => {
        const client = createTestClient();
        const mnemonics = [
            'circle', 'task', 'moral',
            'disagree', 'echo', 'kingdom',
            'agent', 'kite', 'love',
            'indoor', 'manage', 'orphan',
            'royal', 'business', 'whisper',
            'saddle', 'sun', 'dog',
            'street', 'cart', 'flash',
            'cheese', 'swift', 'turkey'
        ];
        const key = await mnemonicToWalletKey(mnemonics);
        let wallet = await client.findWalletFromSecretKey({ workchain: 0, secretKey: key.secretKey });
        expect(wallet.address.workChain).toBe(0);
        expect(wallet.address.hash).toEqual(Buffer.from('d1e27790cea91f133d2847785705c26987ae1de4d75d3fc1fcc1f374b6140802', 'hex'));
    });

    it('should use workchain 0 when creating new wallet', async () => {
        const client = createTestClient();
        let wallet = await client.createNewWallet({ workchain: 0 });
        expect(wallet.wallet.address.workChain).toBe(0);
    });

    it('should use workchain -1 when creating new wallet', async () => {
        const client = createTestClient();
        let wallet = await client.createNewWallet({ workchain: -1 });
        expect(wallet.wallet.address.workChain).toBe(-1);
    });

    it('should resolve contract info', async () => {
        const client = createTestClient();
        let state = await client.getContractState(Address.parseFriendly('0QCyt4ltzak71h6XkyK4ePfZCzJQDSVUNuvZ3VE7hP_Q-GTE').address);
        expect(state.balance.eq(new BN(0))).toBe(true);
        expect(state.state).toBe('uninitialized');
        state = await client.getContractState(Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address);
        expect(state.balance.gte(new BN(0))).toBe(true);
        expect(state.state).toBe('active');
    });

    it('should resolve masterchain info', async () => {
        const client = createTestClient();
        let res = await client.getMasterchainInfo();
        expect(res.shard).not.toEqual('0');
    });

    // it('should being able to read all transactions', async () => {
    //     const client = await createTestClient();
    //     const address = Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address;
    //     const limit = 10;
    //     let offset: { lt: string, hash: string } | null = null;
    //     let txs: TonTransaction[] = [];
    //     while (true) {
    //         let tx2 = await client.getTransactions({ address, limit, before: offset });
    //         for (let t of tx2) {
    //             txs.push(t);
    //         }

    //         if (tx2.length === 0) {
    //             break;
    //         }

    //         offset = tx2[tx2.length - 1].id as any;
    //         console.log(offset);
    //     }
    //     console.warn(txs);
    // });
});