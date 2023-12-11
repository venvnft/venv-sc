---
cover: .gitbook/assets/d05826eb-e1c7-4147-9e9a-d022832924ed (1).png
coverY: 0
---

# Venera

## Contract Overview&#x20;

The [**Venera**](https://app.gitbook.com/o/5LNmuVDQh92u5gKY5NSn/s/5qBPNNbJKNTEdvV4O5qB/) smart contract serves as the primary orchestrator, coordinating the functionalities of [**VeneraSale**](venerasale.md) and [**VeneraAuction**](venaraauction.md). This contract unifies the core features required for trading music in **NFT** format on the blockchain.

***

## Technical Specifications&#x20;

### Functions and Responsibilities

1. **Contract Coordination**: **Venera** integrates the functionalities of [**VeneraSale**](venerasale.md) and [**VeneraAuction**](venaraauction.md), enabling seamless trade interactions for **NFT**.
2. **Ownership Management**: Inherits from **OpenZeppelin's** **`Ownable`** contract, allowing exclusive access for the contract owner to essential functionalities.
3. **Ether Balance Operations**:
   * **`getBalance()`**: Retrieves the current Ether balance of the contract.
   * **`withdraw()`**: Enables the contract owner to withdraw the entire Ether balance.
4. **Fallback Function**:
   * **`receive() external payable`**: Allows the contract to receive Ether.

{% @github-files/github-code-block url="https://github.com/venvnft/venv-sc/blob/main/contracts/Venera.sol" fullWidth="false" %}

***

## Integration with Other Contracts

* [**VeneraSale**](venerasale.md): Handles direct sales of **NFT** at fixed prices.
* [**VeneraAuction**](venaraauction.md): Manages **NFT** auctions, facilitating bidding and auction finalization.

***

## Key Dependencies

* [**OpenZeppelin Contracts**](https://docs.openzeppelin.com/contracts/5.x/api/access#Ownable): Utilizes the `Ownable` contract from OpenZeppelin for ownership functionalities.
* [**VeneraSale**](venerasale.md) **and** [**VeneraAuction**](venaraauction.md): The smooth operation of Venera relies on the successful functioning of [**VeneraSale**](venerasale.md) and [**VeneraAuction**](venaraauction.md).

***

## Technical Architecture

The contract employs `Solidity version ^0.8.22` and is developed in compliance with **Ethereum's** [**ERC721**](https://docs.openzeppelin.com/contracts/5.x/erc721) and [**ERC1155**](https://docs.openzeppelin.com/contracts/5.x/erc1155) standards. It integrates essential modifiers for data validation and relies on secure blockchain operations for transparent and reliable **NFT** trading.

[**Venera**](https://venvnft.github.io/venvpage/) acts as the control center, managing the intricate operations of sales and auctions, ensuring a seamless and secure platform for trading music in the form of **NFT**.
