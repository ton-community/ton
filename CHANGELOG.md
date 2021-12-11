# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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