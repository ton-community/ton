import BN from "bn.js";
import { Address, Cell, TonClient } from "..";
import { parseDict, parseDictBitString } from "../boc/dict/parseDict";
import { Contract } from "./Contract";
import { ContractSource } from "./sources/ContractSource";
import { UnknownContractSource } from "./sources/UnknownContractSource";

export class ElectorContract implements Contract {
    // Please note that we are NOT loading address from config to avoid mistake and send validator money to a wrong contract
    readonly address: Address = Address.parseRaw('-1:3333333333333333333333333333333333333333333333333333333333333333');
    readonly source: ContractSource = new UnknownContractSource('org.ton.elector', -1, 'Elector Contract');
    private readonly client: TonClient;

    constructor(client: TonClient) {
        this.client = client;
    }

    async getReturnedStake(addres: Address) {
        if (addres.workChain !== -1) {
            throw Error('Only masterchain addresses could have stake');
        }
        let res = await this.client.callGetMethod(this.address, 'compute_returned_stake', [["num", "0x" + addres.hash.toString('hex')]]);
        if (res.stack[0][0] !== 'num') {
            throw Error('Invalid response');
        }
        let stake = res.stack[0][1] as string;
        if (!stake.startsWith('0x')) {
            throw Error('Invalid response');
        }
        return new BN(stake.slice(2), 'hex');
    }

    async getPastElectionsList() {
        let res = await this.client.callGetMethod(this.address, 'past_elections_list');
        let list = res.stack[0][1].elements;
        let elections: { id: number, unfreezeAt: number, stakeHeld: number }[] = [];
        for (let el of list) {
            let elect = el.tuple.elements;
            let id = new BN(elect[0].number.number).toNumber();
            let unfreezeAt = new BN(elect[1].number.number).toNumber();
            let stakeHeld = new BN(elect[3].number.number).toNumber();
            elections.push({ id, unfreezeAt, stakeHeld });
        }
        return elections;
    }


    async getPastElections() {
        let res = await this.client.callGetMethod(this.address, 'past_elections');
        let list = res.stack[0][1].elements;
        let elections: { id: number, unfreezeAt: number, stakeHeld: number, totalStake: BN, bonuses: BN, frozen: Map<string, { address: Address, weight: BN, stake: BN }> }[] = [];
        for (let el of list) {
            let elect = el.tuple.elements;
            let id = new BN(elect[0].number.number).toNumber();
            let unfreezeAt = new BN(elect[1].number.number).toNumber();
            let stakeHeld = new BN(elect[2].number.number).toNumber();
            let totalStake = new BN(elect[5].number.number);
            let bonuses = new BN(elect[6].number.number);
            let frozenDict = Cell.fromBoc(Buffer.from(elect[4].cell.bytes, 'base64'))[0];
            let frozen = parseDict(frozenDict, 256, (cell, reader) => {
                let address = new Address(-1, reader.readBuffer(32));
                let weight = reader.readUint(64);
                let stake = reader.readCoins();
                return {
                    address,
                    weight,
                    stake
                };
            });
            elections.push({ id, unfreezeAt, stakeHeld, totalStake, bonuses, frozen });
        }
        return elections;
    }

    async getElectionEntities() {
        let res = await this.client.callGetMethod(this.address, 'participant_list_extended');

        // let startWorkTime = parseInt(res.stack[0][1], 16);
        // let endElectionsTime = parseInt(res.stack[1][1], 16);
        // let minStake = parseInt(res.stack[2][1], 16);
        // let allStakes = parseInt(res.stack[3][1], 16);
        let electionEntries = res.stack[4][1].elements;

        let entities: { pubkey: Buffer, stake: BN, address: Address }[] = [];
        for (let e of electionEntries) {
            let pubkey = Buffer.from(e.tuple.elements[0].number.number, 'hex');
            let stake = new BN(e.tuple.elements[1].tuple.elements[0].number.number);

            let addrraw = new BN(e.tuple.elements[1].tuple.elements[2].number.number).toString('hex');
            while (addrraw.length < 64) {
                addrraw = '0' + addrraw;
            }

            let address = new Address(-1, Buffer.from(addrraw, 'hex'));
            // console.warn(Buffer.from(addrraw, 'hex').length);
            entities.push({ pubkey, stake: stake, address });
        }
        return entities;
    }
}