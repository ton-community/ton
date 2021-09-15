import { Cell } from "../boc/Cell";
import { CommonMessageInfo } from "./CommonMessageInfo";
import { EmptyMessage } from "./EmptyMessage";

const NativeContract = require('tonweb').Contract;
const NativeCell = require('tonweb').boc.Cell;

describe('CommonMessageInfo', () => {
    it('should comform to tonweb implementation', () => {
        {
            let cell = new Cell();
            new CommonMessageInfo().writeTo(cell);
            let res = NativeContract.createCommonMsgInfo(new NativeCell());
            expect(cell.toString()).toEqual(res.print());
        }

        {
            let cell = new Cell();
            new CommonMessageInfo({ body: new EmptyMessage() }).writeTo(cell);
            let res = NativeContract.createCommonMsgInfo(new NativeCell(), null, new NativeCell());
            expect(cell.toString()).toEqual(res.print());
        }
    });
});