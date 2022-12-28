import { createTestClient } from "../tests/createTestClient";
import { createTestClient4 } from "../tests/createTestClient4";
import { ConfigContract } from "./ConfigContract";

describe('ConfigContract', () => {
    it('should execute get methods', async () => {
        const client = createTestClient4('mainnet');
        let contract = client.open(ConfigContract.create());
        let res = await contract.getSeqno();
        console.warn(res);
        let cfg = await contract.getConfigs();
        console.warn(cfg);
    }, 15000);
});