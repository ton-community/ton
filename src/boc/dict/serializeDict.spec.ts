import { Cell } from "../Cell";
import { buildTree, serializeDict } from "./serializeDict";

describe('serializeDict', () => {
    it('should build prefix tree', () => {

        // From docs
        const map = new Map<string, number>();
        map.set('13', 169);
        map.set('17', 289);
        map.set('239', 57121);

        // Test built tree
        let tree = buildTree(map, 16);
        expect(tree).toMatchSnapshot();

        // Test serialization
        const res = serializeDict(map, 16, (src, cell) => cell.bits.writeUint(src, 16));
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
        expect(res.equals(root)).toBe(true);
    });
});