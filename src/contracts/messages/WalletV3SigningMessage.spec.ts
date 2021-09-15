import { BN } from "bn.js";
import { Address } from "../..";
import { Cell } from "../../boc/Cell";
import { toNano } from "../../utils/convert";
import { CommonMessageInfo } from "../../messages/CommonMessageInfo";
import { EmptyMessage } from "../../messages/EmptyMessage";
import { InternalMessage } from "../../messages/InternalMessage";
import { WalletV3SigningMessage } from "./WalletV3SigningMessage";

const NativeContract = require('tonweb').Contract;
const NativeAddress = require('tonweb').Address;
const NativeCell = require('tonweb').boc.Cell;

describe('WalletV3SigningMessage', () => {
    it('should comform to tonweb implementation', async () => {

        function createSigningMessage(seqno: number) {
            seqno = seqno || 0;
            const message = new NativeCell();
            message.bits.writeUint(698983191, 32);
            if (seqno === 0) {
                // message.bits.writeInt(-1, 32);// todo: dont work
                for (let i = 0; i < 32; i++) {
                    message.bits.writeBit(1);
                }
            } else {
                const date = new Date();
                const timestamp = Math.floor(date.getTime() / 1e3);
                message.bits.writeUint(timestamp + 60, 32);
            }
            message.bits.writeUint(seqno, 32);
            return message;
        }

        const address = 'EQDR4neQzqkfEz0oR3hXBcJph64d5NddP8H8wfN0thQIAqDH';
        const amount = toNano(0.001);
        const sendMode = 3;
        const seqno = 10;
        const orderHeader = NativeContract.createInternalMessageHeader(new NativeAddress(Address.parseFriendly(address).address.toFriendly({ 'bounceable': false })), new BN(amount));
        const order = NativeContract.createCommonMsgInfo(orderHeader, null, new NativeCell());
        const signingMessage = createSigningMessage(seqno);
        signingMessage.bits.writeUint8(sendMode);
        signingMessage.refs.push(order);

        const signingMessage2 = new WalletV3SigningMessage({
            seqno: seqno,
            sendMode: sendMode,
            order: new InternalMessage({
                to: Address.parseFriendly(address).address,
                value: amount,
                bounce: false,
                body: new CommonMessageInfo({ body: new EmptyMessage() })
            })
        });
        const signCell = new Cell();
        signingMessage2.writeTo(signCell);
        expect(signCell.toString()).toEqual(signingMessage.print());
    });
});