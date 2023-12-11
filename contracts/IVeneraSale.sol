// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IVeneraSale {

    struct Sale {
        address payable seller;
        address payable nftContract;
        uint tokenId;
        uint price;
        uint startTime;
        uint endTime;
    }

    event SaleCreate(
        bytes32 _saleId, 
        address _seller, 
        address indexed _nftContract, 
        uint indexed _tokenId, 
        uint _price, 
        uint _duration);

    event SaleEnded(
        address _seller,
        address _buyer,
        address indexed _nftContract,
        uint indexed _tokenId,
        uint _price,
        uint _time
    );

    function sellBatch(
        address _nftContract,
        uint[] calldata _tokenId,
        uint[] calldata _price,
        uint[] calldata _duration) external;
    
    function sell(
        address _nftContract,
        uint _tokenId,
        uint _price,
        uint _duration) external;

    function sellMultiBatch(
        address _nftContract,
        uint[] calldata _tokenId,
        uint[] calldata _quantity,
        uint[] calldata _price,
        uint[] calldata _duration) external;

    function sellMulti(
        address _nftContract,
        uint _tokenId,
        uint _quantity,
        uint _price,
        uint _duration) external;

    function getSale(bytes32 _saleId) external view returns(Sale memory);

    function getPrice(bytes32 _saleId) external view returns(uint);

    function getFine(bytes32 _saleId) external view returns(uint);
    
    function cancel(bytes32 _saleId) external payable;

    function buy(bytes32 _saleId) external payable;
}