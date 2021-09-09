import { Address } from "./Address";

describe('Address', () => {
    it('should parse addresses in various forms', () => {
        let address1 = Address.parseFriendly('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO');
        let address2 = Address.parseFriendly('kQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi47nL');
        let address3 = Address.parseRaw('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        expect(address1.isBounceable).toBe(false);
        expect(address2.isBounceable).toBe(true);
        expect(address1.isTestOnly).toBe(true);
        expect(address2.isTestOnly).toBe(true);
        expect(address1.address.workChain).toBe(0);
        expect(address2.address.workChain).toBe(0);
        expect(address3.workChain).toBe(0);
        expect(address1.address.hash).toEqual(Buffer.from('2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3', 'hex'));
        expect(address2.address.hash).toEqual(Buffer.from('2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3', 'hex'));
        expect(address3.hash).toEqual(Buffer.from('2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3', 'hex'));
        expect(address1.address.toString()).toBe('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        expect(address2.address.toString()).toBe('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        expect(address3.toString()).toBe('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
    });
    it('should serialize to friendly form', () => {
        let address = Address.parseRaw('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');

        // Bounceable
        expect(address.toFriendly()).toMatch('EQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4wJB');
        expect(address.toFriendly({ testOnly: true })).toMatch('kQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi47nL');
        expect(address.toFriendly({ urlSafe: false })).toMatch('EQAs9VlT6S776tq3unJcP5Ogsj+ELLunLXuOb1EKcOQi4wJB');
        expect(address.toFriendly({ urlSafe: false, testOnly: true })).toMatch('kQAs9VlT6S776tq3unJcP5Ogsj+ELLunLXuOb1EKcOQi47nL');

        // Non-Bounceable
        expect(address.toFriendly({ bounceable: false })).toMatch('UQAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi41-E');
        expect(address.toFriendly({ bounceable: false, testOnly: true })).toMatch('0QAs9VlT6S776tq3unJcP5Ogsj-ELLunLXuOb1EKcOQi4-QO');
        expect(address.toFriendly({ bounceable: false, urlSafe: false })).toMatch('UQAs9VlT6S776tq3unJcP5Ogsj+ELLunLXuOb1EKcOQi41+E');
        expect(address.toFriendly({ bounceable: false, urlSafe: false, testOnly: true })).toMatch('0QAs9VlT6S776tq3unJcP5Ogsj+ELLunLXuOb1EKcOQi4+QO');
    });
    it('should implement equals', () => {
        let address1 = Address.parseRaw('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        let address2 = Address.parseRaw('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        let address3 = Address.parseRaw('-1:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e3');
        let address4 = Address.parseRaw('0:2cf55953e92efbeadab7ba725c3f93a0b23f842cbba72d7b8e6f510a70e422e5');
        expect(address1.equals(address2)).toBe(true);
        expect(address2.equals(address1)).toBe(true);
        expect(address2.equals(address4)).toBe(false);
        expect(address2.equals(address3)).toBe(false);
        expect(address4.equals(address3)).toBe(false);
    });
});