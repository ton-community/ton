import { BN } from "bn.js";
import { Address } from "..";
import { Cell } from "../boc/Cell";
import { CommonMessageInfo } from "./CommonMessageInfo";
import { InternalMessage } from "./InternalMessage";

const NativeContract = require('tonweb').Contract;
const NativeCell = require('tonweb').boc.Cell;

describe('InternalMessage', () => {
    it('should comform to tonweb implementation', () => {

        const orderHeader = NativeContract.createInternalMessageHeader(
            'EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH',
            new BN(1000000),
            true,
            false
        );
        const order = NativeContract.createCommonMsgInfo(orderHeader, null, null);

        const orderOwn = new InternalMessage({
            to: Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address,
            value: new BN(1000000),
            bounce: false,
            body: new CommonMessageInfo()
        });
        const cell = new Cell();
        orderOwn.writeTo(cell);
        expect(cell.toString()).toEqual(order.print());
    });
});