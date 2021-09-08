import BN from "bn.js";
import { Address, TonClient } from "..";
import { fromNano } from "../utils/convert";
import { Contract } from "./Contract";
import { ContractSource } from "./sources/ContractSource";
import { UnknownContractSource } from "./sources/UnknownContractSource";

export class ElectorContract implements Contract {
    readonly address: Address = Address.parseRaw('-1:3333333333333333333333333333333333333333333333333333333333333333');
    readonly source: ContractSource = new UnknownContractSource('org.ton.elector', -1);
    private readonly client: TonClient;

    constructor(client: TonClient) {
        this.client = client;
    }

    async getElectionEntities() {
        let res = await this.client.callGetMethod(this.address, 'participant_list_extended');

        // let startWorkTime = parseInt(res.stack[0][1], 16);
        // let endElectionsTime = parseInt(res.stack[1][1], 16);
        // let minStake = parseInt(res.stack[2][1], 16);
        // let allStakes = parseInt(res.stack[3][1], 16);
        let electionEntries = res.stack[4][1].elements;

        let entities: { pubkey: Buffer, stake: number, address: Address }[] = [];
        for (let e of electionEntries) {
            let pubkey = Buffer.from(e.tuple.elements[0].number.number, 'hex');
            let stake = new BN(e.tuple.elements[1].tuple.elements[0].number.number);

            let addrraw = new BN(e.tuple.elements[1].tuple.elements[2].number.number).toString('hex');

            let address = new Address(-1, Buffer.from(addrraw, 'hex'));
            console.warn(Buffer.from(addrraw, 'hex').length);
            entities.push({ pubkey, stake: fromNano(stake), address });
        }
        return entities;
    }
}