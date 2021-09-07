import { TonClient } from "..";

export async function createTestClient() {
    return new TonClient({ endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC' });
}