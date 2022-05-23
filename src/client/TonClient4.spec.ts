import BN from "bn.js";
import { Address } from "../address/Address";
import { beginCell } from "../boc/Builder";
import { TonClient4 } from "./TonClient4";

const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

describe('TonClient4', () => {
    it('should fetch blocks', async () => {
        await client.getLastBlock();
        await client.getBlock(1000);
        await client.getBlock(100000);
        await client.getBlock(20241422);
    });
    it('should fetch config', async () => {
        await client.getConfig(1000);
        await client.getConfig(100000);
        await client.getConfig(20241422);
        await client.getConfig(20241422, [1, 2, 3]);
    });
    it('should get accounts', async () => {
        await client.getAccount(1000, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'));
        await client.getAccount(100000, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'));
        await client.getAccount(20241422, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'));
    });
    it('should get lite accounts', async () => {
        await client.getAccountLite(1000, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'));
        await client.getAccountLite(100000, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'));
        await client.getAccountLite(20241422, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'));
    });

    it('should get account change state', async () => {
        await client.isAccountChanged(1000, Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'), new BN(1231232));
        await client.isAccountChanged(100000, Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'), new BN(1231232));
        await client.isAccountChanged(20241422, Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'), new BN(1231232));
    });
    it('should get methods', async () => {
        await client.runMethod(1000, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'), 'seqno');
        await client.runMethod(10241422, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'), 'seqno');
        await client.runMethod(20241422, Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D'), 'seqno');

        await client.runMethod(20241422, Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'), 'get_member', [{ type: 'slice', cell: beginCell().storeAddress(Address.parse('EQAeDrSEHEaKWFGWbuhLMnPQzMR0au7js3Ef0QeOXATF-ukl')).endCell() }]);
    });
    it('should account transactions', async () => {
        await client.getAccountTransactions(Address.parse('EQCo6VT63H1vKJTiUo6W4M8RrTURCyk5MdbosuL5auEqpz-C'), new BN(27668319000001), Buffer.from('x2/3cqpuYzOC0CZU9bNMfGG84FT/huceZpcrcr2Bvgc=', 'base64'));
    })
});