import { Cell } from "../../boc/Cell";
import { WalletV3Order } from "../messages/WalletV3SigningMessage";
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