import { Address } from "ton-core";
import { createTestClient } from "../utils/createTestClient";
import { createTestClient4 } from "../utils/createTestClient4";
import { JettonMaster } from "./JettonMaster";
import { JettonWallet } from "./JettonWallet";

describe('JettonMaster', () => {
    it('should resolve jetton wallet address', async () => {
        let client = createTestClient('mainnet');
        let master = client.open(JettonMaster.open(Address.parse('EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv')));
        let walletAddress = await master.getWalletAddress(Address.parse('EQCo6VT63H1vKJTiUo6W4M8RrTURCyk5MdbosuL5auEqpz-C'));
        expect(walletAddress.equals(Address.parse('EQDslTlGmbLTFi0j4MPT7UVggWR7XRDI2bW6vmNG6Tc_FBDE'))).toBe(true);
        
        let wallet = client.open(JettonWallet.open(walletAddress));
        let balance = await wallet.getBalance();
        expect(balance).toBe(0n);
    });
});