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

        let res = parseDictBitString(root, 16);
        expect(Array.from(res.keys()).length).toBe(3);
    });
});