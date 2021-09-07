import { Address } from "../..";
import { HttpApi } from "./HttpApi";

describe('HttpApi', () => {
    it('should get latest transactions', async () => {
        const api = new HttpApi('https://testnet.toncenter.com/api/v2/jsonRPC');
        await api.getTransactions({ address: Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address, limit: 3 });
    });
});