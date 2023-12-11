# DEMO [Venera](https://venvnft.github.io/venvpage) SmartContract
![Venera](img/banner.jpeg)
[![Venera](https://img.shields.io/badge/venera-1.0.0-black?logo=data:image/jpeg;base64,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&logoColor=white)
](https://venvnft.github.io/venvpage) [![solidity - v0.8.22](https://img.shields.io/static/v1?label=solidity&message=v0.8.22&color=black&logo=solidity)](https://docs.soliditylang.org/en/v0.8.22/) [![NPM openzeppelin Package](https://img.shields.io/badge/@openzeppelin-5.0.1-black?logo=openzeppelin)](https://www.npmjs.org/package/@openzeppelin) [![NPM Hardhat Package](https://img.shields.io/badge/hardhat-2.19.2-black?logo=hardhat)](https://hardhat.org/) [![License](https://img.shields.io/badge/License-MIT-black.svg)]() [![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg)](https://hardhat.org/)
## [Venera](https://venvnft.github.io/venvpage) is a marketplace protocol for NFT music, facilitating sales and auctions for ERC721 and ERC1155 NFTs. 

### See the [documentation](https://venera-1.gitbook.io/venera-1/) and [smart contract documentation](https://venera-1.gitbook.io/venera-smartcontract/) for more information on [Venera](https://venvnft.github.io/venvpage).
---

# Usage
 Here's how you can use the Venera smart contract:
- [Sales](contracts/VeneraSale.sol): Initiate direct sales of NFTs by calling the sale function.
- [Auctions](contracts/VeneraAuction.sol): Start auctions for NFTs using the auction or auctionMulti functions.
---
# Test Coverage

File                 |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
---------------------|----------|----------|----------|----------|----------------|
 contracts/          |      100 |    97.95 |      100 |      100 |                |
  IVeneraAuction.sol |      100 |      100 |      100 |      100 |                |
  IVeneraSale.sol    |      100 |      100 |      100 |      100 |                |
  Libraries.sol      |      100 |      100 |      100 |      100 |                |
  Modifiers.sol      |      100 |    95.45 |      100 |      100 |                |
  Venera.sol         |      100 |      100 |      100 |      100 |                |
  VeneraAuction.sol  |      100 |      100 |      100 |      100 |                |
  VeneraCore.sol     |      100 |       75 |      100 |      100 |                |
  VeneraSale.sol     |      100 |      100 |      100 |      100 |                |
 contracts/Test/     |    71.43 |    33.33 |    71.43 |    71.43 |                |
  Test1155.sol       |       50 |       25 |    66.67 |       50 |             21 |
  Test721.sol        |       80 |       50 |       75 |       80 |             28 |
---------------------|----------|----------|----------|----------|----------------|
All files            |    98.37 |    95.39 |    96.72 |    98.53 |----------------|
---------------------|----------|----------|----------|----------|----------------|
---
# Usage
## Clone the Repository:
```sh
git clone https://github.com/venvnft/venv-sc
```
## Install Dependencies:
```sh
cd venv-sc
npm i
```
## Test smartcontracts
```sh
npx hardhat test --parallel
```
## Test coverage tests
```sh
npx hardhat coverage
```
---
## License

[MIT](LICENSE) Copyright 2023 Venera, Inc.

