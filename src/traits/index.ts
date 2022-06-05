import { TonClient4 } from '../client/TonClient4';
import { address } from './trait_address';
import { amount } from './trait_amount';
import { seqno } from './trait_seqno';

export const Traits = {
    withClient: (src: TonClient4) => {
        return ({
            seqno: seqno(src),
            amount: amount(src),
            address: address(src)
        });
    }
};