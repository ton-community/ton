import { TonClient } from "..";

export function createTestClient(production: boolean = false) {
    return new TonClient({ endpoint: production ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC' });
}