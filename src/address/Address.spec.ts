import { Address } from "./Address";

describe('Address', () => {
    it('should parse address', () => {
        let address1 = new Address('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO');
        let address2 = new Address('kQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi47nL');
        let address3 = new Address('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3')
        expect(address1.isBounceable).toBe(false);
        expect(address2.isBounceable).toBe(true);
        expect(address3.isBounceable).toBeNull();
        expect(address1.isTestOnly).toBe(true);
        expect(address2.isTestOnly).toBe(true);
        expect(address3.isTestOnly).toBeNull();
        expect(address1.workChain).toBe(0);
        expect(address2.workChain).toBe(0);
        expect(address3.workChain).toBe(0);
        expect(address1.hash).toEqual(Buffer.from('2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3', 'hex'));
        expect(address2.hash).toEqual(Buffer.from('2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3', 'hex'));
        expect(address3.hash).toEqual(Buffer.from('2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3', 'hex'));
        expect(address1.toString()).toBe('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        expect(address2.toString()).toBe('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        expect(address3.toString()).toBe('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
    });
});