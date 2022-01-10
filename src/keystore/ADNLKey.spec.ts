import { ADNLKey } from "./ADNLKey";

describe('ADNLKey', () => {
    it('should load ADNL key', async () => {
        let hexId = '6BBAA28397D1BA7B1547270C77F90177644CA9483D4ABB7D12230BE4FD1D1DFC';
        let friendlyId = 'vv3viuds7i3u6yvi4tqy57zaf3witfjja6uvo35cirqxzh5duo7yawg';
        let keyBody = 'FyNoSZWIvbb48Wh6ZQkn7qpMhr4nnFMIsfyj+AW5cSk2Jz11';
        const key = Buffer.from(keyBody, 'base64');
        let adnlKey = await ADNLKey.fromKey(key);
        expect(adnlKey.address.toFriendly()).toEqual(friendlyId);
        expect(adnlKey.address.toRaw()).toEqual(hexId);
        expect(adnlKey.keyPair.publicKey.toString('hex')).toEqual('3d73e4d3f49462dcf2094912b29f8ad020e856bd301d877f3198c5c0c66f3875');
        expect(adnlKey.keyPair.secretKey.toString('hex')).toEqual('9588bdb6f8f1687a650927eeaa4c86be279c5308b1fca3f805b9712936273d753d73e4d3f49462dcf2094912b29f8ad020e856bd301d877f3198c5c0c66f3875');
    })
});