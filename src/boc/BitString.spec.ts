import { BitStringReader } from "..";
import { BitString } from "./BitString";

describe('BitString', () => {
    it('should correctly write bits and iterate', () => {
        let bitString = BitString.alloc(10);
        bitString.writeBit(1);
        bitString.writeBit(true);
        bitString.writeBit(false);
        bitString.writeBit(0);
        bitString.writeBit(-1);
        bitString.writeBit(10);
        let bits: boolean[] = [];
        for (let b of bitString) {
            bits.push(b);
        }
        expect(bits.length).toBe(6);
        expect(bits[0]).toBe(true);
        expect(bits[1]).toBe(true);
        expect(bits[2]).toBe(false);
        expect(bits[3]).toBe(false);
        expect(bits[4]).toBe(false);
        expect(bits[5]).toBe(true);
    });

    it('should correctly read and write numbers', () => {
        let bitString = BitString.alloc(10);
        bitString.writeInt(-1, 4);
        let reader = new BitStringReader(bitString);
        expect(reader.readIntNumber(4)).toBe(-1);
    });
});