import { BN } from "bn.js";
import { inspect } from "util";
import { Address } from "../address/Address";
import { beginCell } from "../boc/Builder";
import { Cell } from "../boc/Cell";
import { parseStack, serializeStack } from "./stack";

describe('stack', () => {
    it('should serialize stack with numbers', () => {
        let serialized = serializeStack([{
            "type": "int", "value": new BN("-1")
        }, {
            "type": "int", "value": new BN("-1")
        }, {
            "type": "int", "value": new BN("49800000000")
        }, {
            "type": "int", "value": new BN("100000000")
        }, {
            "type": "int", "value": new BN("100000000")
        }, {
            "type": "int", "value": new BN("2500")
        }, {
            "type": "int", "value": new BN("100000000")
        }]);
        expect(serialized.toBoc({ idx: false, crc32: false }).toString('base64')).toEqual('te6ccgEBCAEAWQABGAAABwEAAAAABfXhAAEBEgEAAAAAAAAJxAIBEgEAAAAABfXhAAMBEgEAAAAABfXhAAQBEgEAAAALmE+yAAUBEgH//////////wYBEgH//////////wcAAA==');
    });

    it('should serialize stack long unmbers', () => {
        const golden = 'te6ccgEBAgEAKgABSgAAAQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqt4e0IsLXV0BAAA=';
        let serialized = serializeStack([
            {
                "type": "int", "value": new BN("12312312312312323421")
            }
        ]);
        expect(serialized.toBoc({ idx: false, crc32: false }).toString('base64')).toEqual(golden);
    });

    it('should serialize slices', () => {
        const golden = 'te6ccgEBAwEAHwACDwAAAQQAB0AgAgEAHeBhIIRGeIhda/QFs8ibOAAA';
        let serialized = serializeStack([
            {
                "type": "slice", "cell": beginCell().storeCoins(new BN("123123123123123234211234123123123")).endCell()
            }
        ]);
        expect(serialized.toBoc({ idx: false, crc32: false }).toString('base64')).toEqual(golden);
    });

    it('should serialize address', () => {
        const golden = 'te6ccgEBAwEAMgACDwAAAQQAELAgAgEAQ5_5N0I0swMbwhQMZdlgFyGLyjnRvwQ_TZTRvL8db8NQtNAAAA';
        let serialized = serializeStack([
            {
                "type": "slice", "cell": beginCell().storeAddress(Address.parse('kf_JuhGlmBjeEKBjLssAuQxeUc6N-CH6bKaN5fjrfhqFpqVQ')).endCell()
            }
        ]);
        expect(serialized.toBoc({ idx: false, crc32: false }).toString('base64url')).toEqual(golden);
    });

    it('should serialize int', () => {
        const golden = 'te6ccgEBAgEAKgABSgAAAQIAyboRpZgY3hCgYy7LALkMXlHOjfgh+mymjeX4634ahaYBAAA=';
        let serialized = serializeStack([
            {
                "type": "int", "value": new BN('91243637913382117273357363328745502088904016167292989471764554225637796775334', 10)
            }
        ]);
        expect(serialized.toBoc({ idx: false, crc32: false }).toString('base64')).toEqual(golden);
    });

    it('should serialize tuples', () => {
        let golden = 'te6ccgEBEAEAjgADDAAABwcABAkDAQEGBwABAgEJBAAHQCAFAgAGBAECAwUAHeBhIIRGeIhda/QFs8ibOAIACAcAEgEAAAAAAAHimQASAQAAAAAAAAB7ARIB//////////8KARIBAAAAAAAAAAMLARIBAAAAAAAAAAIMARIBAAAAAAAAAAENAQIADgESAQAAAAAAAAABDwAA';
        const st = parseStack(Cell.fromBoc(Buffer.from(golden, 'base64'))[0]);
        let gs = serializeStack(st);
        // console.warn(inspect(parseStack(gs), false, null, true));
        // console.warn(inspect(st, false, null, true));
        expect(gs.toBoc({ idx: false, crc32: false }).toString('base64')).toEqual(golden);
        // let serialized = serializeStack([
        //     {
        //         type: 'int', value: new BN(1)
        //     },
        //     {
        //         type: 'null'
        //     },
        //     {
        //         type: 'int', value: new BN(1)
        //     },
        //     {
        //         type: 'int', value: new BN(2)
        //     },
        //     {
        //         type: 'int', value: new BN(3)
        //     },
        //     {
        //         type: 'int', value: new BN(-1)
        //     },
        // ]);
        // expect(serialized.toBoc({ idx: false, crc32: false }).toString('base64')).toEqual(golden);
    })
});