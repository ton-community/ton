import { createTestClient } from "../tests/createTestClient";

describe('ElectorContract', () => {
    it('should fetch entities', async () => {
        const client = createTestClient(true);
        await client.services.elector.getElectionEntities();
        // console.warn(JSON.stringify(elections.map((v) => v.address.toFriendly())));
    });
});