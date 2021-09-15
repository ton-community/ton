import { Address } from "..";
import { Cell } from "../boc/Cell";
import { EmptyMessage } from "./EmptyMessage";
import { ExternalMessage } from "./ExternalMessage";

const NativeContract = require('tonweb').Contract;
const NativeCell = require('tonweb').boc.Cell;

describe('ExternalMessage', () => {
    it('should comform to tonweb implementation', () => {
        
        let cell = new Cell();
        new ExternalMessage({
            to: Address.parseFriendly('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH').address,
            body: new EmptyMessage()
        }).writeTo(cell);

        let res = NativeContract.createExternalMessageHeader('EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH');
        expect(cell.toString()).toEqual(res.print());
    });
});