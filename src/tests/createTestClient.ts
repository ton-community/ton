import { TonClient } from "..";

export function createTestClient(production: boolean = false) {
    return new TonClient({ endpoint: production ? 'https://mainnet.tonhubapi.com/jsonRPC' : 'https://sandbox.tonhubapi.com/jsonRPC' });
}