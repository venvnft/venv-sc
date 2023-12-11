// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IVeneraAuction {

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

    event AuctionCreate(
        bytes32 _saleId, 
        address _seller, 
        address indexed _nftContract, 
        uint indexed _tokenId, 
        uint _price, 
        uint _duration);

    event AuctionEnded(
        address _seller,
        address _buyer,
        address indexed _nftContract,
        uint indexed _tokenId,
        uint _price,
        uint _time
    );

    function auctionMultiBatch(
        address _nftContract,
        uint[] calldata _tokenId,
        uint[] calldata _quantity,
        uint[] calldata _price,
        uint[] calldata _duration) external;

    function auctionMulti(
        address _nftContract,
        uint _tokenId,
        uint _quantity,
        uint _price,
        uint _duration) external;

    function auctionBatch(
        address _nftContract,
        uint[] calldata _tokenId,
        uint[] calldata _price,
        uint[] calldata _duration) external;

    function auction(
        address _nftContract,
        uint _tokenId,
        uint _price,
        uint _duration) external;

    function cancelAuc(bytes32 _saleId) external payable;

    function bid(bytes32 _saleId) external payable;

    function endAuc(bytes32 _saleId) external;

    function getAuc(bytes32 _saleId) external view returns(Auction memory);

    function getAucPrice(bytes32 _saleId) external view returns(uint);

    function getAucFine(bytes32 _saleId) external view returns(uint);
}