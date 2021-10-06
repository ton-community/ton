import { createTestClient } from "../tests/createTestClient";
import { ConfigContract } from "./ConfigContract";

describe('ConfigContract', () => {
    it('should execute get methods', async () => {
        const client = createTestClient();
        const contract = new ConfigContract(client);
        
        // Check seqno method
        expect((await contract.getSeqNo())).toBeGreaterThan(0);

        // Check that configs are parseable
        await contract.getConfigsRaw();
    });
});