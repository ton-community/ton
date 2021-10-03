import { ContractSource } from "./ContractSource";

export type WalletSource =
    ContractSource & (
        {
            readonly walletVersion: 'v1';
        } |
        {
            readonly walletVersion: 'v2';
        } |
        {
            readonly walletVersion: 'v3';
            readonly walletId: number;
        }
    )