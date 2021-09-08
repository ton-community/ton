import { delay } from "../utils/time";

export async function awaitCondition(ms: number, condition: () => Promise<boolean>) {
    let start = Date.now();
    while (Date.now() - start < ms) {
        if (await condition()) {
            return;
        }
        await delay(1000);
    }
    if (await condition()) {
        return;
    }
    throw Error('Condition await timeout');
}