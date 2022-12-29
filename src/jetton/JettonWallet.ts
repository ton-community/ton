import { Address, Contract, ContractProvider } from "ton-core";

export class JettonWallet implements Contract {

    static open(address: Address) {
        return new JettonWallet(address);
    }

    readonly address: Address;

    private constructor(address: Address) {
        this.address = address;
    }

    async getBalance(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type !== 'active') {
            return 0n;
        }
        let res = await provider.get('get_wallet_data', []);
        return res.stack.readBigNumber();
    }
}
