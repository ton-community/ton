import { mnemonicToWalletKey } from "ton-crypto";
import { Address } from "../address/Address";
import { createTestClient } from "../tests/createTestClient";
import { TonClient } from "./TonClient";

describe('TonClient', () => {
    it('should read balance', async () => {
        const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
        const address = Address.parseFriendly('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO');
        let balance = (await client.getBalance(address.address));
        expect(balance).toBe(0);
        balance = (await client.getBalance(Address.parseFriendly('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO').address));
        expect(balance).toBe(0);
    });

    it('should use workchain 0 when load from mnemonics', async () => {
        const client = await createTestClient();
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
        let wallet = await client.openWallet(key.publicKey);
        expect(wallet.address.workChain).toBe(0);
        expect(wallet.address.hash).toEqual(Buffer.from('d1e27790cea91f133d2847785705c26987ae1de4d75d3fc1fcc1f374b6140802', 'hex'));
    });

    it('should use workchain 0 when creating new wallet', async () => {
        const client = await createTestClient();
        let wallet = await client.createWallet();
        expect(wallet.wallet.address.workChain).toBe(0);
    });

    it('should resolve contract info', async () => {
        const client = await createTestClient();
        let state = await client.getContractState(Address.parseFriendly('0QCyt4ltzak71h6XkyK4ePfZCzJQDSVUNuvZ3VE7hP_Q-GTE').address);
        expect(state.balance).toBe(0);
        expect(state.state).toBe('uninitialized');
        state = await client.getContractState(Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address);
        expect(state.balance).toBeGreaterThan(0);
        expect(state.state).toBe('active');
    });
});