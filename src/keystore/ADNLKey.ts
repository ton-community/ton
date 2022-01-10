import { KeyPair, keyPairFromSeed, sha256 } from "ton-crypto";
import { ADNLAddress } from "../address/ADNLAddress";

const KEY_PREFIX = Buffer.from('17236849', 'hex');

export class ADNLKey {

    static async fromKey(src: Buffer) {
        if (src.length !== 36) {
            throw Error('Invalid key');
        }
        if (!src.slice(0, 4).equals(KEY_PREFIX)) {
            throw Error('Invalid key');
        }
        const keySeed = src.slice(4);

        // Create keypair
        const keyPair = keyPairFromSeed(keySeed);

        // Create address
        const address = await sha256(Buffer.concat([Buffer.from([0xC6, 0xB4, 0x13, 0x48]), keyPair.publicKey]));

        return new ADNLKey(new ADNLAddress(address), keyPair);
    }

    readonly address: ADNLAddress;
    readonly keyPair: KeyPair;

    constructor(address: ADNLAddress, keyPair: KeyPair) {
        this.address = address;
        this.keyPair = keyPair;
    }
}