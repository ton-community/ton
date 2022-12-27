import { beginCell, Cell } from "ton-core";
import { Maybe } from "../../types";
import { ConfigStore } from "../../utils/ConfigStore";
import { ContractSource } from "./ContractSource";

export class WalletV4Source implements ContractSource {

    static readonly SOURCE = Buffer.from(
        'te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBIAIDAgFIBAUE+PKDCNcYINMf0x/THwL4I7vyZO1E0NMf0x/T//QE0VFDuvKhUVG68qIF+QFUEGT5EPKj+AAkpMjLH1JAyx9SMMv/UhD0AMntVPgPAdMHIcAAn2xRkyDXSpbTB9QC+wDoMOAhwAHjACHAAuMAAcADkTDjDQOkyMsfEssfy/8QERITAubQAdDTAyFxsJJfBOAi10nBIJJfBOAC0x8hghBwbHVnvSKCEGRzdHK9sJJfBeAD+kAwIPpEAcjKB8v/ydDtRNCBAUDXIfQEMFyBAQj0Cm+hMbOSXwfgBdM/yCWCEHBsdWe6kjgw4w0DghBkc3RyupJfBuMNBgcCASAICQB4AfoA9AQw+CdvIjBQCqEhvvLgUIIQcGx1Z4MesXCAGFAEywUmzxZY+gIZ9ADLaRfLH1Jgyz8gyYBA+wAGAIpQBIEBCPRZMO1E0IEBQNcgyAHPFvQAye1UAXKwjiOCEGRzdHKDHrFwgBhQBcsFUAPPFiP6AhPLassfyz/JgED7AJJfA+ICASAKCwBZvSQrb2omhAgKBrkPoCGEcNQICEekk30pkQzmkD6f+YN4EoAbeBAUiYcVnzGEAgFYDA0AEbjJftRNDXCx+AA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA4PABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AAG7SB/oA1NQi+QAFyMoHFcv/ydB3dIAYyMsFywIizxZQBfoCFMtrEszMyXP7AMhAFIEBCPRR8qcCAHCBAQjXGPoA0z/IVCBHgQEI9FHyp4IQbm90ZXB0gBjIywXLAlAGzxZQBPoCFMtqEssfyz/Jc/sAAgBsgQEI1xj6ANM/MFIkgQEI9Fnyp4IQZHN0cnB0gBjIywXLAlAFzxZQA/oCE8tqyx8Syz/Jc/sAAAr0AMntVA==',
        'base64'
    );

    static create(opts: { workchain: number, publicKey: Buffer, walletId?: Maybe<number> }) {

        // Build initial code and data
        const walletId = opts.walletId ? opts.walletId : 698983191;
        let initialCode = Cell.fromBoc(WalletV4Source.SOURCE)[0];
        let initialData = beginCell()
            .storeUint(0, 32)
            .storeUint(walletId, 32)
            .storeBuffer(opts.publicKey)
            .storeBit(0)
            .endCell();

        return new WalletV4Source({ initialCode, initialData, workchain: opts.workchain, walletId, publicKey: opts.publicKey });
    }

    static restore(backup: string) {
        const store = new ConfigStore(backup);
        return WalletV4Source.create({
            workchain: store.getInt('wc'),
            publicKey: store.getBuffer('pk'),
            walletId: store.getInt('walletId'),
        });
    }

    readonly initialCode: Cell;
    readonly initialData: Cell;
    readonly walletId: number;
    readonly workchain: number;
    readonly publicKey: Buffer;
    readonly type = 'org.ton.wallets.v4';
    readonly walletVersion = 'v4';

    private constructor(args: { initialCode: Cell, initialData: Cell, workchain: number, walletId: number, publicKey: Buffer }) {
        this.initialCode = args.initialCode;
        this.initialData = args.initialData;
        this.workchain = args.workchain;
        this.walletId = args.walletId;
        this.publicKey = args.publicKey;
    }

    describe() {
        return 'Wallet v4 #' + this.walletId;
    }

    backup() {
        const config = new ConfigStore();
        config.setInt('wc', this.workchain);
        config.setBuffer('pk', this.publicKey);
        config.setInt('walletId', this.walletId);
        return config.save();
    }
}