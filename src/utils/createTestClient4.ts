import { TonClient4 } from "../client/TonClient4";

export function createTestClient4(net?: 'testnet' | 'mainnet') {
    return new TonClient4({ endpoint: net === 'mainnet' ? 'https://mainnet-v4.tonhubapi.com' : 'https://testnet-v4.tonhubapi.com' });
}