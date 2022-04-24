import BN from "bn.js";
import { Address } from "../address/Address";

export function bnToAddress(chain: number, bn: BN) {
    let r = bn.toString("hex");
    while (r.length < 64) {
        r = "0" + r;
    }
    return new Address(chain, Buffer.from(r, "hex"));
}