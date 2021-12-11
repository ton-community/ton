import { findCommonPrefix } from "./findCommonPrefix";

describe('findCommonPrefix', () => {
    it('should find common prefix', () => {
        expect(findCommonPrefix([
            '0000111',
            '0101111',
            '0001111'
        ])).toEqual('0');
        expect(findCommonPrefix([
            '0000111',
            '0001111',
            '0000101'
        ])).toEqual('000');
        expect(findCommonPrefix([
            '0000111',
            '1001111',
            '0000101'
        ])).toEqual('');
    })
});