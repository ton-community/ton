import { Cell } from "../boc/Cell";
import { CommonMessageInfo } from "./CommonMessageInfo";

const NativeContract = require('tonweb').Contract;
const NativeCell = require('tonweb').boc.Cell;

describe('CommonMessageInfo', () => {
    it('should comform to tonweb implementation', () => {
        let cell = new Cell();
        new CommonMessageInfo().writeTo(cell);
        let res = NativeContract.createCommonMsgInfo(new NativeCell());
        expect(cell.toHex()).toEqual(res.print());
    });
});