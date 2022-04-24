import { sha256_sync, sign, signVerify } from "ton-crypto";
import { Cell } from "../boc/Cell";

function createSafeSignHash(cell: Cell) {
    return sha256_sync(Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from('ton-safe-sign-magic'), cell.hash()]));
}

export function safeSign(cell: Cell, secretKey: Buffer) {
    return sign(createSafeSignHash(cell), secretKey);
}

export function safeSignVerify(cell: Cell, signature: Buffer, publicKey: Buffer) {
    return signVerify(createSafeSignHash(cell), signature, publicKey);
}