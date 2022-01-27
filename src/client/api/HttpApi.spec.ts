import { BN } from "bn.js";
import { Address, Cell } from "../..";
import { CommonMessageInfo } from "../../messages/CommonMessageInfo";
import { ExternalMessage } from "../../messages/ExternalMessage";
import { InMemoryCache } from "../TonCache";
import { HttpApi } from "./HttpApi";

describe('HttpApi', () => {
    it('should get balance', async () => {
        const api = new HttpApi('https://testnet.toncenter.com/api/v2/jsonRPC', new InMemoryCache());
        let res = await api.getAddressInformation(Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address);
        expect(new BN(res.balance).gte(new BN(0))).toBe(true);
    });

    it('should send external messages', async () => {
        const api = new HttpApi('https://mainnet.tonhubapi.com/jsonRPC', new InMemoryCache());
        const message = new ExternalMessage({
            to: Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address,
            body: new CommonMessageInfo()
        });
        const cell = new Cell();
        message.writeTo(cell);
        await api.sendBoc((await cell.toBoc({ idx: false })));
    });

    it('should get seqno', async () => {
        const api = new HttpApi('https://testnet.toncenter.com/api/v2/jsonRPC', new InMemoryCache());
        let res = await api.callGetMethod(Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address, 'seqno', []);
        expect(res.exit_code).toBe(0);
    });

    it('should get transactions', async () => {
        const api = new HttpApi('https://mainnet.tonhubapi.com/jsonRPC', new InMemoryCache());
        await api.getTransactions(Address.parseFriendly('kf91o4NNTryJ-Cw3sDGt9OTiafmETdVFUMvylQdFPoOxIsLm').address, { limit: 10 });
        await api.getTransactions(Address.parseFriendly('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF').address, { limit: 100 });
    });

    it('should support paging', async () => {
        const api = new HttpApi('https://mainnet.tonhubapi.com/jsonRPC', new InMemoryCache());
        let tx1 = await api.getTransactions(Address.parseFriendly('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF').address, { limit: 10 });
        let tx2 = await api.getTransactions(Address.parseFriendly('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF').address, {
            limit: 10,
            lt: tx1[tx1.length - 1].transaction_id.lt,
            hash: tx1[tx1.length - 1].transaction_id.hash,
        });
        expect(tx1.length).toBe(10);
        expect(tx2.length).toBe(10);
    });

    it('should support get transaction', async () => {
        const api = new HttpApi('https://mainnet.tonhubapi.com/jsonRPC', new InMemoryCache());
        let tx1 = await api.getTransactions(Address.parseFriendly('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF').address, { limit: 10 });
        let tx = await api.getTransaction(Address.parseFriendly('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF').address,
            tx1[0].transaction_id.lt,
            tx1[0].transaction_id.hash
        );
        expect(tx1.length).toBe(10);
        expect(tx).not.toBeNull();
        expect(tx).not.toBeUndefined();
    });

    it('should get masterchain info', async () => {
        const api = new HttpApi('https://mainnet.tonhubapi.com/jsonRPC', new InMemoryCache());
        let mc = await api.getMasterchainInfo();
        let shards = await api.getShards(mc.last.seqno);
        expect(shards.length).toBe(1);
        await api.getBlockTransactions(-1, mc.last.seqno, mc.last.shard);
        await api.getBlockTransactions(shards[0].workchain, shards[0].seqno, shards[0].shard);
    });

    it('should estimate fee', async () => {
        const api = new HttpApi('https://testnet.toncenter.com/api/v2/jsonRPC', new InMemoryCache());
        const cell = new Cell();
        const fees = await api.estimateFee(Address.parse('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH'), {
            body: cell,
            initCode: null,
            initData: null,
            ignoreSignature: true
        });
        console.warn(fees);
    });
});