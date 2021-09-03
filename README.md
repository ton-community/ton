# TON js client

[![Version npm](https://img.shields.io/npm/v/ton.svg?logo=npm)](https://www.npmjs.com/package/ton)

Cross-platform client for TON blockchain.

## Features

- 🚀 Create new wallets
- 🍰 Get balance
- ✈️ Transfers

## Install

```bash
yarn add ton buffer
```

#### Browser polifil

```js
// Add before using library
require("buffer");
```

## Usage

To use this library you need HTTP API endpoint, you can use one of the public endpoints:

- Mainnet: https://toncenter.com/api/v2/jsonRPC
- Testnet: https://testnet.toncenter.com/api/v2/jsonRPC

```js
import { TonClient } from "ton";

// Create Client
const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});

// Open Wallet
const wallet = await client.openWallet('<public-key>');
console.log(wallet.address);
console.log(await wallet.getBalance());

// Transfering coins
let seqno = await wallet.getSeqNo();

// In case of failure you can safely retry calling this method
await wallet.transfer({ to: 'some-address', amount: 10.0, seqno, secretKey: '<secret>' });
```

# License

MIT
