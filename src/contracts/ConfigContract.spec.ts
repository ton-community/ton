import { createTestClient } from "../tests/createTestClient";
import { ConfigContract } from "./ConfigContract";
import { ContractExecutor } from "./ContractExecutor";
import { open } from "./open";

describe('ConfigContract', () => {
    it('should execute get methods', async () => {
        const client = createTestClient(true);

        let cc = new ConfigContract();
        let executor: ContractExecutor = {
            getState: async () => {
                let state = await client.getContractState(cc.address);
                return {
                    balance: state.balance,
                    state: state.state === 'active' ? {
                        kind: 'active',
                        state: { data: state.data!, code: state.code! }
                    } : state.state === 'frozen' ? { kind: 'frozen' } : { kind: 'unint' }
                }
            },
            callGetMethod: async (name) => {
                let res = await client.callGetMethod(cc.address, name);
                return { stack: res.stack, gas: res.gas_used };
            },
        };
        let contract = open(new ConfigContract(), executor);
        let res = await contract.getSeqno();
        console.warn(res);
        let cfg = await contract.getConfigs();
        console.warn(cfg);

        // const contract = new ConfigContract(client);

        // // Check seqno method
        // // expect((await contract.getSeqNo())).toBeGreaterThan(0);

        // // Check that configs are parseable
        // let raw = await contract.getConfigsRaw();
        // console.warn(raw);

        // // Check config typed parsing
        // let res = await contract.getConfigs();
        // console.warn(res);
    }, 15000);
});