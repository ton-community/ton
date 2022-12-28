import { TonClient } from "../client/TonClient";

export function createTestClient(net?: 'testnet' | 'mainnet') {
    return new TonClient({ endpoint: net === 'mainnet' ? 'https://mainnet.tonhubapi.com/jsonRPC' : 'https://sandbox.tonhubapi.com/jsonRPC' });
}