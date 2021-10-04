import { ConfigStore } from "./ConfigStore";

describe('ConfigStore', () => {
    it('should persist values', () => {
        let store = new ConfigStore();
        store.setInt('wc', -1);
        store.setBuffer('cd', Buffer.from('hello', 'utf-8'));
        expect(store.save()).toEqual('wc=-1,cd=68656c6c6f');
        store = new ConfigStore('wc=-1,cd=68656c6c6f');
        expect(store.getInt('wc')).toBe(-1);
        expect(store.getBuffer('cd').equals(Buffer.from('hello', 'utf-8'))).toBe(true);
    });
});