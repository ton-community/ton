import { getSecureRandomBytes, openBox, pbkdf2_sha512, sealBox, sha256 } from 'ton-crypto';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { Address } from '..';

const codec = t.type({
    version: t.number,
    salt: t.string,
    records: t.array(t.type({
        name: t.string,
        address: t.string,
        kind: t.string,
        config: t.string,
        publicKey: t.string,
        secretKey: t.string,
        comment: t.string
    }))
});

type RawType = t.TypeOf<typeof codec>;

type KeyRecordStorage = {
    name: string;
    address: Address;
    kind: string;
    config: string;
    comment: string;
    publicKey: string;
    secretKey: string;
};

export type KeyRecord = {
    name: string;
    address: Address;
    kind: string;
    config: string;
    comment: string;
    publicKey: Buffer;
}

export class KeyStore {

    static async createNew(password: string) {
        let encryptionSalt = await pbkdf2_sha512(password, 'TON Encrypted Storage Salt', 1000000, 32);
        let encryptionNonce = await pbkdf2_sha512(password, 'TON Encrypted Storage Nonce', 1000000, 24);
        let encryptionKey = await pbkdf2_sha512(password, 'TON Encrypted Storage Key', 1000000, 32);
        let sealed = sealBox(encryptionSalt, encryptionNonce, encryptionKey).toString('hex');
        return new KeyStore({ version: 1, salt: sealed, records: [] });
    }

    static async load(source: Buffer) {
        // Validate checksum
        if (source.length < 32) {
            throw Error('Broken keystore');
        }
        let hash = source.slice(0, 32);
        let data = source.slice(32);
        let hash2 = await sha256(data);
        if (!hash.equals(hash2)) { // We don't care about timing attacks here
            throw Error('Broken keystore');
        }

        // Parse storage
        let parsed = JSON.parse(data.toString('utf-8'));
        let decoded = codec.decode(parsed);
        if (isLeft(decoded)) {
            throw Error('Broken keystore');
        }
        return new KeyStore(decoded.right);
    }

    #salt: string;
    #records = new Map<string, KeyRecordStorage>();

    private constructor(src: RawType) {
        if (src.version !== 1) {
            throw Error('Unsupported keystore');
        }
        this.#salt = src.salt;
        for (let r of src.records) {
            if (this.#records.has(r.name)) {
                throw Error('Broken keystore');
            }
            const record: KeyRecordStorage = {
                name: r.name,
                address: Address.parseRaw(r.address),
                kind: r.kind,
                config: r.config,
                comment: r.comment,
                publicKey: r.publicKey,
                secretKey: r.secretKey
            };
            Object.freeze(record);
            this.#records.set(r.name, record);
        }
    }

    get allKeys() {
        let res: KeyRecord[] = [];
        for (let k of this.#records.keys()) {
            let r = this.#records.get(k)!;
            res.push({
                name: r.name,
                address: r.address,
                kind: r.kind,
                config: r.config,
                comment: r.comment,
                publicKey: Buffer.from(r.publicKey, 'hex')
            });
        }
        return res;
    }

    getSecretKey = async (name: string, password: string) => {
        if (!this.#records.has(name)) {
            throw Error('Key with name ' + name + ' does not exist');
        }
        let record = this.#records.get(name)!;
        let src = Buffer.from(record.secretKey, 'hex');
        let nonce = src.slice(0, 24);
        let data = src.slice(24);
        let encryptionKey = await pbkdf2_sha512(password, 'TON Encrypted Storage: ' + record.name, 1000000, 32);
        let res = openBox(data, nonce, encryptionKey);
        if (!res) {
            throw Error('Invalid password');
        }
        return res;
    }

    addKey = async (record: KeyRecord, password: string, key: Buffer) => {
        if (this.#records.has(record.name)) {
            throw Error('Key with name ' + record.name + ' already exists');
        }

        // Check password
        let encryptionSalt = await pbkdf2_sha512(password, 'TON Encrypted Storage Salt', 1000000, 32);
        let encryptionNonce = await pbkdf2_sha512(password, 'TON Encrypted Storage Nonce', 1000000, 24);
        let encryptionKey2 = await pbkdf2_sha512(password, 'TON Encrypted Storage Key', 1000000, 32);
        let sealed = sealBox(encryptionSalt, encryptionNonce, encryptionKey2);
        if (!sealed.equals(Buffer.from(this.#salt, 'hex'))) {
            throw Error('Invalid password');
        }

        // Create key
        let encryptionKey = await pbkdf2_sha512(password, 'TON Encrypted Storage: ' + record.name, 1000000, 32);
        let nonce = await getSecureRandomBytes(24);
        let encryptedSecretKey = sealBox(key, nonce, encryptionKey);
        let rec = {
            name: record.name,
            address: record.address,
            kind: record.kind,
            config: record.config,
            comment: record.comment,
            publicKey: record.publicKey.toString('hex'),
            secretKey: Buffer.concat([nonce, encryptedSecretKey]).toString('hex')
        };
        Object.freeze(rec);
        this.#records.set(record.name, rec);
    }

    removeKey = (name: string) => {
        if (!this.#records.has(name)) {
            throw Error('Key with name ' + name + ' does not exist');
        }
        this.#records.delete(name);
    }

    async save() {
        let store: RawType = {
            version: 1,
            salt: this.#salt,
            records: Array.from(this.#records.entries()).map((v) => ({
                name: v[1].name,
                address: v[1].address.toString(),
                kind: v[1].kind,
                config: v[1].config,
                comment: v[1].comment,
                publicKey: v[1].publicKey,
                secretKey: v[1].secretKey
            }))
        };

        let data = Buffer.from(JSON.stringify(store), 'utf-8');
        let hash = await sha256(data);
        return Buffer.concat([hash, data]);
    }
}