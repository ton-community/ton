import { Cell, fromNano, parseDictBitString, Slice } from "..";

describe('Slice', () => {
    it('should correctly parse slice', () => {
        const data = Buffer.from(
            'te6cckEBAgEAdwABlQAAAAGABdKDBKoKIeylvKMvkrzd8kx/u3fPQlnrZfq6Osh4kyfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQ7msoADAEATaAfbgG48KMsJCzkEIf/7nVUBtm8+QWadeayjUryqCULc6juaygAELxkHPM=',
            'base64'
        );

        let res = Cell.fromBoc(data)[0];
        const slice = Slice.fromCell(res);
        const seqno = slice.readUint(32);
        const owner = slice.readAddress();
        const seed = slice.readBuffer(32);
        const acceptStakes = slice.readBit();
        const workingCoins = slice.readCoins();
        const lockedCoins = slice.readCoins();
        const nominators = slice.readOptDict(256, (s) => s.readRemaining().buffer.toString('hex'));
        console.warn(seqno);
        console.warn(owner);
        console.warn(seed);
        console.warn(acceptStakes);
        console.warn(fromNano(workingCoins));
        console.warn(fromNano(lockedCoins));
        console.warn(nominators);
        const dict = res.refs[0];
        console.warn(parseDictBitString(dict.beginParse(), 256));
    });
});