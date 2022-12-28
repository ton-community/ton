import { createTestClient4 } from "../tests/createTestClient4";
import { ConfigContract } from "./ConfigContract";

describe('ConfigContract', () => {
    it('should execute get methods', async () => {
        const client = createTestClient4('mainnet');
        let contract = client.open(ConfigContract.create());
        let res = await contract.getSeqno();
        expect(res).toMatchSnapshot();
        let cfg = await contract.getConfigs();
        expect(cfg).toMatchSnapshot();
    }, 15000);
});