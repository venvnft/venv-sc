# DEMO [Venera](https://venvnft.github.io/venvpage) SmartContract
![Venera](.gitbook/assets/1.jpeg)
[![solidity - v0.8.22](https://img.shields.io/static/v1?label=solidity&message=v0.8.22&color=black&logo=solidity)](https://docs.soliditylang.org/en/v0.8.22/) [![NPM openzeppelin Package](https://img.shields.io/badge/@openzeppelin-5.0.1-black?logo=openzeppelin)](https://www.npmjs.org/package/@openzeppelin) [![NPM Hardhat Package](https://img.shields.io/badge/hardhat-2.19.2-black?logo=hardhat)](https://hardhat.org/) [![License](https://img.shields.io/badge/License-MIT-black.svg)]() [![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg)](https://hardhat.org/)
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
