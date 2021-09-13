jest.setTimeout(60000);
import { Address } from "..";
import { KeyStore } from "./KeyStore";

describe('KeyStore', () => {
    it('should create new storre', async () => {
        let keystore = await KeyStore.createNew('password');
        expect(keystore.allKeys.length).toBe(0);
        let saved = await keystore.save();
        let keystore2 = await KeyStore.load(saved);
        expect(keystore2.allKeys.length).toBe(0);
    });

    it('should add new keys', async () => {
        let keystore = await KeyStore.createNew('password');
        await keystore.addKey({
            name: 'key-1',
            kind: 'test-key',
            address: Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address,
            config: '',
            comment: '',
            publicKey: Buffer.from([4, 5, 6])
        }, Buffer.from([1, 2, 3]));
        expect(keystore.allKeys.length).toBe(1);
        let saved = await keystore.save();
        let keystore2 = await KeyStore.load(saved);
        expect(keystore2.allKeys.length).toBe(1);

        let secret = await keystore.getSecret('key-1', 'password');
        expect(secret).toEqual(Buffer.from([1, 2, 3]));
        secret = await keystore2.getSecret('key-1', 'password');
        expect(secret).toEqual(Buffer.from([1, 2, 3]));

        await expect(keystore.getSecret('key-1', 'wrong password')).rejects.toThrowError();
        await expect(keystore2.getSecret('key-1', 'wrong password')).rejects.toThrowError();
    });
});