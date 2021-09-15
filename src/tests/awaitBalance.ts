import BN from "bn.js";
import { Address, TonClient } from "..";
import { delay } from "../utils/time";

const TIMEOUT = 30000;

export async function awaitBalance(client: TonClient, address: Address, value: BN) {
    let start = Date.now();
    while (Date.now() - start < TIMEOUT) {
        if ((await client.getBalance(address)).gt(value)) {
            return;
        }
        await delay(1000);
    }
    if ((await client.getBalance(address)).gt(value)) {
        return;
    }
    throw Error('Balance await timeout');
}