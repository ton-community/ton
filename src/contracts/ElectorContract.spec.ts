import { Address } from "..";
import { createTestClient } from "../tests/createTestClient";

describe('ElectorContract', () => {
    it('should fetch entities', async () => {
        const client = createTestClient(true);
        await client.services.elector.getElectionEntities();
        await client.services.elector.getReturnedStake(Address.parseFriendly('Ef_1g5xkp8asoCQkFwJ7y3lLBo2iUvx3mOuWMQYctltIPj1e').address);
        await client.services.elector.getPastElectionsList();
        await client.services.elector.getPastElections();
    });
});