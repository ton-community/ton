import { Address, Builder } from "ton-core";
import { CommonMessageInfo } from "..";
import { Maybe } from "../types";
import { Message } from "./Message";

export class InternalMessage implements Message {

    readonly from: Address | null;
    readonly to: Address;
    readonly value: bigint;
    readonly ihrDisabled: boolean;
    readonly bounce: boolean;
    readonly bounced: boolean;
    readonly ihrFees: bigint;
    readonly fwdFees: bigint;
    readonly createdAt: bigint;
    readonly createdLt: bigint;
    readonly body: CommonMessageInfo;

    constructor(opts: {
        to: Address,
        value: number | bigint,
        bounce: boolean,
        ihrFees?: Maybe<number | bigint>,
        fwdFees?: Maybe<number | bigint>,
        createdLt?: Maybe<number | bigint>,
        createdAt?: Maybe<number>,
        ihrDisabled?: Maybe<boolean>,
        bounced?: Maybe<boolean>,
        from?: Maybe<Address>,
        body: CommonMessageInfo
    }) {
        this.to = opts.to;
        this.value = BigInt(opts.value);
        this.bounce = opts.bounce;
        this.body = opts.body;
        if (opts.from) {
            this.from = opts.from;
        } else {
            this.from = null;
        }
        if (opts.ihrDisabled !== null && opts.ihrDisabled !== undefined) {
            this.ihrDisabled = opts.ihrDisabled;
        } else {
            this.ihrDisabled = true;
        }
        if (opts.bounced !== null && opts.bounced !== undefined) {
            this.bounced = opts.bounced;
        } else {
            this.bounced = false;
        }
        if (opts.ihrFees !== null && opts.ihrFees !== undefined) {
            this.ihrFees = BigInt(opts.ihrFees);
        } else {
            this.ihrFees = BigInt(0);
        }
        if (opts.fwdFees !== null && opts.fwdFees !== undefined) {
            this.fwdFees = BigInt(opts.fwdFees);
        } else {
            this.fwdFees = BigInt(0);
        }
        if (opts.createdAt !== null && opts.createdAt !== undefined) {
            this.createdAt = BigInt(opts.createdAt);
        } else {
            this.createdAt = BigInt(0);
        }
        if (opts.createdLt !== null && opts.createdLt !== undefined) {
            this.createdLt = BigInt(opts.createdLt);
        } else {
            this.createdLt = BigInt(0);
        }
    }

    writeTo(builder: Builder) {
        builder.storeBit(0); // Message id
        builder.storeBit(this.ihrDisabled);
        builder.storeBit(this.bounce);
        builder.storeBit(this.bounced);
        builder.storeAddress(this.from);
        builder.storeAddress(this.to);
        builder.storeCoins(this.value);
        builder.storeBit(false); // Currency collection (not supported)
        builder.storeCoins(this.ihrFees);
        builder.storeCoins(this.fwdFees);
        builder.storeUint(this.createdLt, 64);
        builder.storeUint(this.createdAt, 32);
        this.body.writeTo(builder);
    }
}