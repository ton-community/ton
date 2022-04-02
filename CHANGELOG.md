# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# [9.2.0]
- Builder and dict builder

# [9.1.0]
- Support for API token

# [9.0.0]
- Synchronous Cell's `hash` and a lot of related functions like `contractAddress`.

# [6.10.0]
- Better compatibility with webpack

# [6.8.0]
- Allow large comments

# [6.7.0]
- Exported all parsing methods and `contractAddress`

# [6.6.0]
- ADNL address

# [6.5.2]
- Improve Internal/External messages typings

# [6.5.0-6.5.1]
- Ability to include first transaction in getTransactions method

# [6.4.0]
- Better webpack support

# [6.3.0]

- Added dictionary serialization
- Added `equals` to Cell

# [6.1.0-6.2.1]

- Added parsing of int (as addition to uint) in `BitStreamReader` and `Slice`

# [6.0.0]

- [BREAKING] Change `RawMessage` to `CellMessage` and use `RawMessage` in parseTransaction
- Improve parseTransaction typings. Added:
    - RawAccountStatus
    - RawCurrencyCollection
    - RawCommonMessageInfo
    - RawStateInit
    - RawMessage
    - RawHashUpdate
    - RawAccountStatusChange
    - RawStorageUsedShort
    - RawStoragePhase
    - RawComputePhase
    - RawActionPhase
    - RawBouncePhase
    - RawTransactionDescription
    - RawTransaction