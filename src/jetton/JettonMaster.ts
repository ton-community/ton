import { Address, beginCell, Contract, ContractProvider } from "ton-core";

export class JettonMaster implements Contract {

    static create(address: Address) {
        return new JettonMaster(address);
    }

    readonly address: Address;

    constructor(address: Address) {
        this.address = address;
    }

    async getWalletAddress(provider: ContractProvider, owner: Address) {
        let res = await provider.get('get_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(owner).endCell() }]);
        return res.stack.readAddress();
    }

    async getJettonData(provider: ContractProvider) {
        let res = await provider.get('get_jetton_data', []);
        let totalSupply = res.stack.readBigNumber();
        let mintable = res.stack.readBoolean();
        let adminAddress = res.stack.readAddress();
        let content = res.stack.readCell();
        let walletCode = res.stack.readCell();
        return {
            totalSupply,
            mintable,
            adminAddress,
            content,
            walletCode
        };
    }
}