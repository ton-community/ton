import { Config } from '.';
import { Address } from '../address/Address';
import { Cell } from '../boc/Cell';
import { createTestClient } from '../tests/createTestClient';

describe('Config', () => {
    let configCell!: Cell;
    beforeAll(async () => {
        let client = createTestClient(true);
        let configState = await client.getContractState(Address.parse('Ef9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVbxn'));

        configCell = Cell.fromBoc(configState.data!)[0];
    });

    it('should create config', async () => {
        expect(() => {
            let config = Config.fromCell(configCell);
        }).not.toThrow();
    });

    it('should get msg prices', async () => {
        let config = Config.fromCell(configCell);

        expect(() => {
            config.getMsgPrices(true);
            config.getMsgPrices(false);
        }).not.toThrow();
    });

    it('should get storage prices', async () => {
        let config = Config.fromCell(configCell);

        expect(() => {
            config.getStoragePrices();
        }).not.toThrow();
    });

    it('should parse current config', async () => {
        let config = Config.fromCell(configCell);

        expect(() => {
            config.getGasLimitsAndPrices(true);
            config.getGasLimitsAndPrices(false);
        }).not.toThrow();
    });
})