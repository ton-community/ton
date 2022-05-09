import { Cell } from "../Cell";
import { parseDict, parseDictBitString } from "./parseDict";

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
        parseDictBitString(root.beginParse(), 256);
    });

    it('should parse dict with exotics', () => {
        const dict = Buffer.from('te6cckECMQEABTYAAhOCCc7v0txVpwSwAQIDEwEE53fpbirTglgEAwIISAEBs+lknRDMs3k2joGjp+jknI61P2rMabC6L/qACC9w7jkAAQhIAQGcUdBjRLK2XTGk56evuoGpCTwBOhaNJ3gUFm8TAe0n5QAyAxMBAye9rIc4cIC4MAYFCEgBAW8xXyW0o5rBLIX+pOz+eoPl5Z0fBZeD+gw+8nlzCIBhAAADEwEBQI3GZN/+jNgvBwgDEwEATAHi3hq0fjgKCQgISAEB7X4mvTbvptXZtPaqq5gTrwdCqEJEl390/UB0ycmJCL4AAAhIAQH6TA1tA7w5MqlUZE/iIYZlmhFY/0nMfG9YEH4IA4oG9AAmAxEA/JVwvbaVd7guDAsISAEB16y7YCM4yG1hDzXPs2L9dvwYsYEkdrb8qZoGeOZl/PUAAAIRAOC+0jznnr0oLQ0CEQDgeIc2I3nB6A8OCEgBAe5bbwbC8lILAkcW7BvTGqfH7ackw/xrJ+4xJ9g0lay7ACICDwDcWf0tZ7wILBACDwDPXe4GVoRIEhEISAEBpqnx4FY+VMV5fZOCgk11aYemGilh+4jfDQXGfVnuO2QAHwIPAMwQLzuW7ygrEwIPAMGD4CnDLugVFAhIAQHhkmjGsVW1E//8jS7VtFUP/nG+13eBz2DH8b6lkRkfowATAg8AwL3BnpH5iCoWAg8AwFv9OrsVqBgXCEgBAUnJQzkhkkoQxP70VqQNlWC2ClDLq6thxGgnH+VDOUIdABICDwDAI9NSaezIKRkCDQC0EKoS2YgbGghIAQEUW2BGLrIxcR0xUglz9exM5sN90zhfxgdRBW0FkjOQBQAPAg0ApaMONrGIHRwISAEB20MCSueWmfetSar0Li+5Q8Ip7t01JoPqgAJhVAvv4PEADAINAKFiMLr7SCgeAg0AoV/mfAxIJx8CDQCgRMc88eghIAhIAQHFrdac2QaoB3A0l38UmVSRNUC4pYwh2FyGJ5Vl+MyhJgAJAgkAbRF4aCYiAgkAZzzR6CQjCEgBAax1zsp9u3C3amDOdSJD9mQdDCqhiDj+ZgliaFHwLgWgAAIBj7rR38jjeSour5CAiFzP5jBGI24SWg7B0O37+3W43agB1e+xhmG5Sli1Zv3ZU7LzkGnD7l80gqgY14NkUTcQu0YAAC5TRp8sgyUISAEBnuyDAqn2pYKXQ/wsg9nT0mXlzYlz/XD92d92SJgRWv8AAQhIAQHEi2bfoY75oVrUbsi8DucSPG1oWEcd3KHUGYp0M+RQMQACCEgBAWJ+cuHH5x28R42OXHVN6a1Jf7VXJHmTxS88Gp/rZs2wAAIISAEBOz2DLgJl9RiydhyAtaSVoJad3MYUNnANbILzFnfSgEkADQhIAQHMnAtnlPhbBcz2DH0IRfSKuD1YfeBVgFaujjkW+iHqDgAPCEgBAVyyY7T30fyOwTmieJ8TthLedj5loRH+lxKqP5GbivrBABcISAEBuusLuLgfE7diC4/aes/bPk0SUgkgruJUU+h2pBoayZwAFwhIAQFmUFOfgo2uUi6cXR4FvV6TYWbPc7i/d5MmEQOA4FGbgQAbCEgBAV7HcGhkdhUswzXpHOx7WG6dvrqJjJdLMlC+kTQaJBqhACMISAEBG14jhyXXJ7RLRZCnKyrvsoR9OsBOvnfdOdK6ADqrS88AIQhIAQFZ+0nqF8AuEf14qz7cSjcXQjasTFC5jvk1aLELPzNMHAAnCEgBAdzBkxtJradUwhDmKe2fCZCcreVUbqwio3hW3tN6N2dBAhTWF3cC', 'base64');
        const cs = Cell.fromBoc(dict)[0].beginParse();
        parseDict(cs.readRef(), 256, (slice) => {
            return slice.toCell();
        });
    });
});