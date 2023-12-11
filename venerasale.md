---
cover: .gitbook/assets/d4268f73-1d31-4d58-bea2-5067aafdf411.png
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

# VeneraSale

## Contract Overview&#x20;

VeneraSale is a critical component of the [**Venera**](https://venvnft.github.io/venvpage) ecosystem, enabling direct sales of music-related **NFT** at fixed prices. This smart contract provides a streamlined platform for users to acquire **NFT** without the bidding process typical of auctions.

***

## Technical Specifications&#x20;

#### Functions and Responsibilities

1. **Direct Sale Mechanism**: Facilitates the sale of **NFT** at specified fixed prices.
2. **Price Definition and Sale Initiation**:
   * **`sale()`**: Initiates the sale of a specific token at a predefined price.
3. **Token Management**:
   * **`buy()`**: Allows users to purchase a token at the set price.
4. **Cancel sale**:
   * **`cancel()`**: Allows the owner of the sale to cancel the sale by paying a penalty of **10%** of its **NFT** price.

### Sale Structure

The **Sale** structure defines the core attributes of an active sale within the **VeneraSale** contract:

````solidity
```
struct Sale {
        address payable seller;
        address payable nftContract;
        uint tokenId;
        uint price;
        uint startTime;
        uint endTime;
    }
```
````

* `seller`: Address of the seller initiating the sale.
* `nftContract`: Address of the **NFT** contract where the **NFT** is listed for sale.
* `tokenId`: The unique identifier of the **NFT** being sold.
* `price`: The set price for the **NFT** in token of the blockain.
* `startTime`: The timestamp indicating when the sale commenced.
* `endTime`: The timestamp marking the conclusion of the sale period.

### SaleCreate Event

The **SaleCreate** event is triggered upon the successful establishment of a new sale:

````solidity
```
event SaleCreate(
        bytes32 _saleId, 
        address _seller, 
        address indexed _nftContract, 
        uint indexed _tokenId, 
        uint _price, 
        uint _duration);
```
````

* `bytes32 _saleId`: Unique identifier for the sale.
* `address _seller`: Ethereum address of the seller initiating the sale.
* `address indexed _nftContract`: Indexed Address of the **NFT** contract.
* `uint indexed _tokenId`: Indexed unique identifier of the **NFT** being sold.
* `uint _price`: Sale price of the **NFT** in token of the blockchain.
* `uint _duration`: Duration of the sale period, typically represented in seconds.

This event is logged to provide a transparent record of crucial sale details, facilitating monitoring and analysis of sale activities within the **VeneraSale** contract.

### SaleEnded Event

The **SaleEnded** event is triggered when a sale successfully concludes with a purchase:

````solidity
```
event SaleEnded(
        address _seller,
        address _buyer,
        address indexed _nftContract,
        uint indexed _tokenId,
        uint _price,
        uint _time
    );
```
````

* `address _seller`: Address of the seller concluding the sale.
* `address _buyer`: Address of the buyer who successfully purchased the **NFT**.
* `address indexed _nftContract`: Indexed address of the **NFT** contract.
* `uint indexed _tokenId`: Indexed unique identifier of the **NFT** that was purchased.
* `uint _price`: The sale price of the **NFT** in token of the blockchain.
* `uint _time`: Timestamp indicating the moment when the sale was concluded.

This event logs essential information about a completed sale, providing visibility into the involved parties, the **NFT** contract, the specific **NFT** sold, its price, and the exact time of the sale. The **SaleEnded** event is crucial for monitoring successful transactions and facilitating transparency within the **VeneraSale** contract.

{% @github-files/github-code-block url="https://github.com/venvnft/venv-sc/blob/main/contracts/VeneraSale.sol" fullWidth="false" %}

***

## Key Dependencies [Venera](venera.md) Contract:&#x20;

Collaborates with [**Venera**](venera.md) for contract ownership and seamless integration within the [**Venera**](https://venvnft.github.io/venvpage) ecosystem.

***

## Technical Architecture

**VeneraSale** leverages the `solidity version ^0.8.22` and adheres to **Ethereum's** [**ERC721**](https://docs.openzeppelin.com/contracts/5.x/erc721) and [**ERC1155**](https://docs.openzeppelin.com/contracts/5.x/erc1155) standards for non-fungible tokens. The contract ensures secure and transparent transactions for direct sales of music-related **NFT**.

The integration of **VeneraSale** within the broader [**Venera**](https://venvnft.github.io/venvpage) platform provides users with a straightforward and convenient mechanism to acquire **NFT** at fixed prices, simplifying the purchasing process.

