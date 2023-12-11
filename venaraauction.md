---
cover: .gitbook/assets/0a035d92-9ade-497a-b913-bb421a3bb801.png
coverY: 0
layout:
  cover:
    visible: true
    size: full
  title:
    visible: true
  description:
    visible: true
  tableOfContents:
    visible: true
  outline:
    visible: true
  pagination:
    visible: true
---

# VenaraAuction

## Contract Overview

**VeneraAuction** is a core component of the [**Venera**](https://venvnft.github.io/venvpage) platform, providing an auction mechanism for music-related **NFT**. This smart contract allows users to bid on and participate in auctions for both  [**ERC721**](https://docs.openzeppelin.com/contracts/5.x/erc721) and [**ERC1155**](https://docs.openzeppelin.com/contracts/5.x/erc1155) tokens.

***

## Technical Specifications

### Functions and Responsibilities

1. **Auction Mechanism**: Enables the creation and management of auctions for  [**ERC721**](https://docs.openzeppelin.com/contracts/5.x/erc721) and [**ERC1155**](https://docs.openzeppelin.com/contracts/5.x/erc1155) tokens.
2. **Initiation of Auctions**:
   * **`auction()`**: Initiates an auction for a single [**ERC721**](https://docs.openzeppelin.com/contracts/5.x/erc721) token.
   * **`auctionMulti()`**: Starts auctions for multiple [**ERC721**](https://docs.openzeppelin.com/contracts/5.x/erc721) or [**ERC1155**](https://docs.openzeppelin.com/contracts/5.x/erc1155) tokens.
3. **Bidding**:
   * **`bid()`**: Allows users to place bids on ongoing auctions.
4. **Auction Finalization**:
   * **`endAuc()`**: Finalizes auctions once the duration ends.
5. **Cancel Auction**:
   * **`cancelAuc()`**: Allows the auction owner to cancel the auction by paying a penalty of **10%** of the highest **NFT** price or its original **NFT** price.

### Auction Structure

The **Auction** structure defines the parameters of an auction:

````solidity
```
struct Auction {
        address payable seller;
        address payable nftContract;
        uint tokenId;
        uint price;
        uint startTime;
        uint endTime;
        address payable highBidder;
        uint highBid;
    }
```
````

* `address payable seller`: Address of the seller initiating the auction.
* `address payable nftContract`: Address of the **NFT** contract associated with the auction.
* `uint tokenId`: Unique identifier representing the **NFT** within the auction.
* `uint price`: The starting price set for the auction in token of the blockchain.
* `uint startTime`: Timestamp indicating the auction's start time.
* `uint endTime`: Timestamp indicating the auction's end time.
* `address payable highBidder`: Address of the highest bidder during the auction.
* `uint highBid`: The highest bid amount placed during the auction.

### AuctionCreate Event

The **AuctionCreate** event is emitted upon the creation of a new auction:

````solidity
```
event AuctionCreate(
        bytes32 _saleId, 
        address _seller, 
        address indexed _nftContract, 
        uint indexed _tokenId, 
        uint _price, 
        uint _duration);
```
````

* `bytes32 _saleId`: Unique identifier of the auction.
* `address _seller`: Address of the seller initiating the auction.
* `address indexed _nftContract`: Indexed address of the **NFT** contract.
* `uint indexed _tokenId`: Indexed unique identifier of the **NFT** involved in the auction.
* `uint _price`: The starting price set by the seller for the auction.
* `uint _duration`: The duration of the auction in seconds.

This event records essential details about the initiation of an auction, including the seller's address, **NFT** contract details, specific **NFT** involved, starting price, and auction duration.

### AuctionEnded Event

The **AuctionEnded** event is emitted upon the successful completion of an auction:

````solidity
```
event AuctionEnded(
        address _seller,
        address _buyer,
        address indexed _nftContract,
        uint indexed _tokenId,
        uint _price,
        uint _time
    );
```
````

* `address _seller`: Address of the seller concluding the auction.
* `address _buyer`: Address of the buyer who won the auction.
* `address indexed _nftContract`: Indexed address of the **NFT** contract.
* `uint indexed _tokenId`: Indexed unique identifier of the **NFT** involved in the auction.
* `uint _price`: The final price at which the **NFT** was sold during the auction.
* `uint _time`: Timestamp indicating the time when the auction concluded.

This event logs crucial information about the closure of an auction, including seller and buyer addresses, **NFT** contract details, specific **NFT** sold, final sale price, and the time of auction conclusion.

{% @github-files/github-code-block url="https://github.com/venvnft/venv-sc/blob/main/contracts/VeneraAuction.sol" %}

***

## Key Dependencies

* [**Venera Contract**](venera.md): Collaborates with [Venera](venera.md) to integrate auctions seamlessly within the ecosystem.

***

## Technical Architecture

VeneraAuction operates on `solidity version ^0.8.22` and complies with Ethereum's [**ERC721**](https://docs.openzeppelin.com/contracts/5.x/erc721) and [**ERC1155**](https://docs.openzeppelin.com/contracts/5.x/erc1155) standards for **NFT**. This contract ensures secure and transparent auctions for music-related **NFT**, accommodating both single and batch auctions for various token types.

Integration within the broader [**Venera**](https://venvnft.github.io/venvpage) platform enhances the auction experience for users, providing a trusted and efficient method to acquire music-related **NFT** through bidding.
