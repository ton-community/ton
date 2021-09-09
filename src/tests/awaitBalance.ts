import { Address, TonClient } from "..";
import { delay } from "../utils/time";

const TIMEOUT = 25000;

export async function awaitBalance(client: TonClient, address: Address, value: number) {
    let start = Date.now();
    while (Date.now() - start < TIMEOUT) {
        if ((await client.getBalance(address)) > value) {
            return;
        }
        await delay(1000);
    }
    if ((await client.getBalance(address)) > value) {
        return;
    }
    throw Error('Balance await timeout');
}