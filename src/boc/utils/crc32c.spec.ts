import { crc32c } from "./crc32c";

describe('src32c', () => {
    it('should match test vector', () => {
        expect(crc32c(Buffer.from('123456789'))).toEqual(Buffer.from('839206e3', 'hex'));
    });
});