import { Cell } from "../Cell";
import { parseDictBitString } from "./parseDict";

describe('parseDict', () => {
    it('should parse the one from documentation', () => {
        let root = new Cell()
            .withData('11001000')
            .withReference(new Cell()
                .withData('011000')
                .withReference(new Cell()
                    .withData('1010011010000000010101001'))
                .withReference(new Cell()
                    .withData('1010000010000000100100001')))
            .withReference(new Cell()
                .withData('1011111011111101111100100001'));

        let res = parseDictBitString(root.beginParse(), 16);
        expect(Array.from(res.keys()).length).toBe(3);
    });

    it('should parse with single node', () => {
        let root = new Cell();
        root.bits.writeBuffer(Buffer.from('a01f6e01b8f0a32c242ce41087ffee755406d9bcf9059a75e6b28d4af2a8250b73a8ee6b2800', 'hex'));
        let res = parseDictBitString(root.beginParse(), 256);
        console.warn(res);
    });
});