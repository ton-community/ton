import { Cell } from "./Cell";
const NativeCell = require('tonweb').boc.Cell;

describe('Cell', () => {
    it('should correctly calculate hash', async () => {
        let cell = new Cell();
        let nativeCell = new NativeCell();
        cell.bits.writeBit(0);
        nativeCell.bits.writeBit(0);
        cell.bits.writeBit(1);
        nativeCell.bits.writeBit(1);
        cell.bits.writeBit(0);
        nativeCell.bits.writeBit(0);
        cell.bits.writeBit(1);
        nativeCell.bits.writeBit(1);
        cell.bits.writeBit(0);
        nativeCell.bits.writeBit(0);
        cell.bits.writeBit(1);
        nativeCell.bits.writeBit(1);
        expect(await cell.hash()).toEqual(Buffer.from(await nativeCell.hash()));
    });

    it('should correctly load cell', async () => {
        let cell = Cell.fromBoc(Buffer.from('B5EE9C724101010100710000DEFF0020DD2082014C97BA218201339CBAB19F71B0ED44D0D31FD31F31D70BFFE304E0A4F2608308D71820D31FD31FD31FF82313BBF263ED44D0D31FD31FD3FFD15132BAF2A15144BAF2A204F901541055F910F2A3F8009320D74A96D307D402FB00E8D101A4C8CB1FCB1FCBFFC9ED5410BD6DAD', 'hex'));
        let nativeCell = NativeCell.fromBoc('B5EE9C724101010100710000DEFF0020DD2082014C97BA218201339CBAB19F71B0ED44D0D31FD31F31D70BFFE304E0A4F2608308D71820D31FD31FD31FF82313BBF263ED44D0D31FD31FD3FFD15132BAF2A15144BAF2A204F901541055F910F2A3F8009320D74A96D307D402FB00E8D101A4C8CB1FCB1FCBFFC9ED5410BD6DAD');
        expect(cell.length).toBe(nativeCell.length);
        for (let i = 0; i < cell.length; i++) {
            expect(await cell[i].hash()).toEqual(Buffer.from(await nativeCell[i].hash()));
        }
    });
});