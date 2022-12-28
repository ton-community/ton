import { TonClient } from "../client/TonClient";

export function createTestClient(net?: 'testnet' | 'mainnet') {
    return new TonClient({
        endpoint: net === 'mainnet' ? 'https://mainnet.tonhubapi.com/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: net !== 'mainnet' ? '32df40f4ffc11053334bcdf09c7d3a9e6487ee0cb715edf8cf667c543edb10ca' : undefined
    });
}