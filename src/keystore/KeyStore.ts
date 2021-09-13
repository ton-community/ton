import { getSecureRandomBytes, pbkdf2_sha512, sha256 } from 'ton-crypto';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { Address } from '..';
import nacl from 'tweetnacl';

const codec = t.type({
    version: t.number,
    salt: t.string,
    publicKey: t.string,
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

export async function createKeyStoreKey(password: string, salt: Buffer) {
    let secretKey = await pbkdf2_sha512(password, salt, 400000, 32);
    let r = nacl.box.keyPair.fromSecretKey(secretKey);
    return {
        secretKey: Buffer.from(r.secretKey),
        publicKey: Buffer.from(r.publicKey)
    }
}

export class KeyStore {

    static async createNew(password: string) {
        let salt = await getSecureRandomBytes(32);
        let key = await createKeyStoreKey(password, salt);
        return new KeyStore({ version: 1, salt: salt.toString('hex'), publicKey: key.publicKey.toString('hex'), records: [] });
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
    #publicKey: string;
    #records = new Map<string, KeyRecordStorage>();

    private constructor(src: RawType) {
        if (src.version !== 1) {
            throw Error('Unsupported keystore');
        }
        this.#salt = src.salt;
        this.#publicKey = src.publicKey;
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

    checkPassword = async (password: string) => {
        let key = await createKeyStoreKey(password, Buffer.from(this.#salt, 'hex'));
        if (!key.publicKey.equals(Buffer.from(this.#publicKey, 'hex'))) {
            return false;
        } else {
            return true;
        }
    }

    hasKey = (name: string) => {
        return this.#records.has(name);
    }

    getKey = (name: string): KeyRecord | null => {
        let ex = this.#records.get(name);
        if (ex) {
            return {
                name: ex.name,
                address: ex.address,
                kind: ex.kind,
                config: ex.config,
                comment: ex.comment,
                publicKey: Buffer.from(ex.publicKey, 'hex')
            };
        }
        return null;
    }

    getSecret = async (name: string, password: string) => {
        if (!this.#records.has(name)) {
            throw Error('Key with name ' + name + ' does not exist');
        }
        let record = this.#records.get(name)!;
        let src = Buffer.from(record.secretKey, 'hex');
        let nonce = src.slice(0, 24);
        let publicKey = src.slice(24, 24 + 32);
        let data = src.slice(24 + 32);

        // Derive key
        let key = await createKeyStoreKey(password, Buffer.from(this.#salt, 'hex'));
        if (!key.publicKey.equals(Buffer.from(this.#publicKey, 'hex'))) {
            throw Error('Invalid password');
        }

        // Decode
        let decoded = nacl.box.open(data, nonce, publicKey, key.secretKey);
        if (!decoded) {
            throw Error('Invalid password');
        }

        return Buffer.from(decoded);
    }

    addKey = async (record: KeyRecord, key: Buffer) => {
        if (this.#records.has(record.name)) {
            throw Error('Key with name ' + record.name + ' already exists');
        }

        // Create key
        let ephemeralKeySecret = await getSecureRandomBytes(32);
        let ephemeralKeyPublic = Buffer.from((nacl.box.keyPair.fromSecretKey(ephemeralKeySecret)).publicKey);
        let nonce = await getSecureRandomBytes(24);
        let encrypted = nacl.box(key, nonce, Buffer.from(this.#publicKey, 'hex'), ephemeralKeySecret);
        let data = Buffer.concat([nonce, ephemeralKeyPublic, encrypted]);

        // Create record
        let rec = {
            name: record.name,
            address: record.address,
            kind: record.kind,
            config: record.config,
            comment: record.comment,
            publicKey: record.publicKey.toString('hex'),
            secretKey: data.toString('hex')
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
            publicKey: this.#publicKey,
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