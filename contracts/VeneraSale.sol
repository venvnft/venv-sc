// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./IVeneraSale.sol";
import "./Modifiers.sol";

contract VeneraSale is IVeneraSale, Modifiers {
    mapping (bytes32 => Sale) sales;

    /**
     * @dev Modifies a function to ensure that the sale identified by `_saleId` has ended.
     * Requirements:
     * - Checks if the sale's end time has passed to allow the function to proceed.
     */
    modifier stoppedSale(bytes32 _saleId) {
        require(
            _stopped(sales[_saleId].endTime), 
            "Sale ended");
        _;
    }

    /**
     * @notice Function to create sales for multiple ERC721 tokens.
     * @param _nftContract Address of the ERC721 NFT contract.
     * @param _tokenId Array of token IDs of the ERC721 tokens to be sold.
     * @param _price Array of sale prices for the corresponding tokens.
     * @param _duration Array of durations for the sales of the corresponding tokens.
     * @dev This function creates sales for multiple ERC721 tokens simultaneously.
     *      It ensures that input lengths match and are valid, then iterates through each token to create a sale.
     *      The `sell` function is called for each token ID in the loop.
     * @dev This function is meant for ERC721 tokens.
     */
    function sellBatch(
        address _nftContract,
        uint[] calldata _tokenId,
        uint[] calldata _price,
        uint[] calldata _duration) external 
        tokensDup(_tokenId) {
        require(
            _tokenId.length > 0 && 
            _tokenId.length == _price.length && 
            _price.length == _duration.length,
            "Invalid input");
        for (uint i = 0; i < _tokenId.length; i++) {
            sell(_nftContract, _tokenId[i], _price[i], _duration[i]);   
        }
    }    

    /**
     * @notice Function to create a sale for an ERC721 token.
     * @param _nftContract Address of the ERC721 NFT contract.
     * @param _tokenId Token ID of the ERC721 token to be sold.
     * @param _price Sale price for the token.
     * @param _duration Duration of the sale for the specified token.
     * @dev This function ensures that the NFT contract is valid, the caller owns the specified ERC721 token, and the provided price is valid.
     *      It approves the contract to transfer the ERC721 token and calls the internal `_sell` function to create the sale.
     * @dev This function is meant for ERC721 tokens.
     */
    function sell(
        address _nftContract,
        uint _tokenId,
        uint _price,
        uint _duration) public 
        contractValid(_nftContract)
        ownerValid(_nftContract, _tokenId)
        priceValid(_price) {
        _approve(_nftContract);
        _sell(_getSaleId(_nftContract, _tokenId), _nftContract, _tokenId, _price, _duration);
    }    

    /**
     * @notice Initiates the sale of multiple tokens from an ERC1155 contract.
     * @param _nftContract Address of the ERC1155 contract.
     * @param _tokenId Array of token IDs to be sold.
     * @param _quantity Array of quantities for each token ID to be sold.
     * @param _price Sale prices for each token ID.
     * @param _duration Duration of the sale for each token ID.
     * @dev This function performs validations on the input arrays, ensuring their lengths are equal,
     *      and iteratively initiates sales for each token ID using the `sellMulti` function.
     * @dev Requires valid input lengths and emits a `SaleCreate` event for each successfully initiated sale.
     * @dev Reverts if the input lengths are invalid.
     */
    function sellMultiBatch(
        address _nftContract,
        uint[] calldata _tokenId,
        uint[] calldata _quantity,
        uint[] calldata _price,
        uint[] calldata _duration) external 
        tokensDup(_tokenId) {
        require(
            _tokenId.length > 0 && 
            _tokenId.length == _price.length && 
            _price.length == _quantity.length && 
            _quantity.length == _duration.length,
            "Invalid input");
        for (uint i = 0; i < _tokenId.length; i++) {
            sellMulti(_nftContract, _tokenId[i], _quantity[i], _price[i], _duration[i]);   
        }
    }    

    /**
     * @notice Initiates the sale of multiple quantities of an ERC1155 token.
     * @param _nftContract Address of the ERC1155 contract.
     * @param _tokenId Token ID to be sold in multiple quantities.
     * @param _quantity Quantity of tokens to be sold.
     * @param _price Sale price for each token.
     * @param _duration Duration of the sale for the specified token.
     * @dev This function approves the contract for transfer and initiates sales for multiple quantities
     *      of the specified token by invoking the `_sell` function for each individual token.
     * @dev Requires a valid contract, valid ownership of the specified tokens in the given quantity,
     *      a valid sale price, and valid sale quantity. Emits a `SaleCreate` event for each successful sale.
     */
    function sellMulti(
        address _nftContract,
        uint _tokenId,
        uint _quantity,
        uint _price,
        uint _duration) public 
        contractValid(_nftContract)
        ownerMultiValid(_nftContract, _tokenId, _quantity) 
        priceValid(_price)
        quantityValid(_quantity) {
        _approveMulti(_nftContract);
        for (uint i = 0; i < _quantity; i++) {
            _sell(_getSaleId(_nftContract, _tokenId, i), _nftContract, _tokenId, _price, _duration);
        }
    }    

    /**
     * @notice Internal function to create and store a new sale.
     * @param _saleId Unique identifier for the sale.
     * @param _nftContract Address of the NFT contract.
     * @param _tokenId Token ID to be sold.
     * @param _price Sale price for the token.
     * @param _duration Duration of the sale for the specified token.
     * @dev This function creates a new `Sale` struct and stores it in the `sales` mapping
     *      using the provided sale ID. It emits a `SaleCreate` event to indicate the successful creation of a sale.
     * @dev Requires a valid sale duration and that the token has been delegated to the contract.
     */
    function _sell(
        bytes32 _saleId,
        address _nftContract, 
        uint _tokenId,
        uint _price, 
        uint _duration) internal 
        durationValid(_duration) 
        hasDelegated(_nftContract, _tokenId) {
        Sale memory newSale = Sale({
            seller: payable(msg.sender),
            nftContract: payable(_nftContract),
            tokenId: _tokenId,
            price: _price,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration});
        sales[_saleId] = newSale;
        emit SaleCreate(_saleId, msg.sender, _nftContract, _tokenId, _price, _duration);
    }

    /**
     * @notice Function to retrieve sale information by its ID.
     * @param _saleId The unique identifier of the sale.
     * @return Sale memory The details of the sale associated with the provided sale ID.
     * @dev This function retrieves sale information based on the provided sale ID.
     *      It ensures that the sale is not stopped, then returns the sale details from the `sales` mapping.
     */
    function getSale(bytes32 _saleId) external view stoppedSale(_saleId) returns(Sale memory) {
        return sales[_saleId];
    }

    /**
     * @notice Function to retrieve the price of a sale by its ID.
     * @param _saleId The unique identifier of the sale.
     * @return uint The price of the sale associated with the provided sale ID.
     * @dev This function retrieves the price of a sale based on the provided sale ID.
     *      It ensures that the sale is not stopped, then returns the price from the `sales` mapping.
     */
    function getPrice(bytes32 _saleId) public view stoppedSale(_saleId) returns(uint) {
        return sales[_saleId].price;
    }

    /**
     * @notice Function to retrieve a fine for a sale by its ID.
     * @param _saleId The unique identifier of the sale.
     * @return uint The fine calculated based on the price of the sale associated with the provided sale ID.
     * @dev This function calculates and retrieves a fine for a sale by dividing the price by 10.
     *      It ensures that the sale is not stopped, then calculates the fine as 1/10th of the sale's price
     *      by calling the `getPrice` function and dividing the result by 10.
     */
    function getFine(bytes32 _saleId) public view stoppedSale(_saleId) returns(uint) {
        return getPrice(_saleId) / 10;
    }

    /**
     * @notice Function to cancel a sale and return the NFT back to the seller.
     * @param _saleId The unique identifier of the sale.
     * @dev This function cancels a sale identified by `_saleId`.
     *      It verifies that the sale is not stopped, then cancels the sale by performing the following steps:
     *      - Calls an internal function `_cancelSaleNewOwner` to handle sale cancellation
     *      - Ensures the sender is the seller of the sale
     *      - Checks the sender's balance against the fine associated with the sale using `getFine`
     *      - Verifies that the sender sent an amount greater than or equal to the fine
     *      - Transfers the fine to the contract address (`address(this)`)
     *      - Calls the internal `_cancel` function to finalize the sale cancellation.
     * @dev This function allows the seller to cancel the sale and receive the NFT back by paying the associated fine.
     */
    function cancel(bytes32 _saleId) external payable
        stoppedSale(_saleId) {
        _cancelSaleNewOwner(_saleId);
        require(_senderSeller(sales[_saleId].seller));
        require(_senderBalance(getFine(_saleId)));
        require(msg.value >= getFine(_saleId));
        payable(address(this)).transfer(getFine(_saleId));
        _cancel(_saleId);
    }

    /**
     * @notice Internal function to handle sale cancellation if the seller no longer owns the token.
     * @param _saleId The unique identifier of the sale.
     * @dev This function verifies if the seller still owns the token associated with the sale identified by `_saleId`.
     *      If the seller no longer owns the token, it calls the internal `_cancel` function to finalize the sale cancellation.
     */
    function _cancelSaleNewOwner(bytes32 _saleId) internal {
        if (!_ownerToken(sales[_saleId].seller, sales[_saleId].nftContract, sales[_saleId].tokenId)) {
            _cancel(_saleId);
        }
    }

    /**
     * @notice Internal function to cancel a sale by removing it from the sales mapping.
     * @param _saleId The unique identifier of the sale to be canceled.
     * @dev This function removes the sale identified by `_saleId` from the `sales` mapping.
     */
    function _cancel(bytes32 _saleId) internal {
        delete sales[_saleId];
    }

    /**
     * @dev Allows a user to purchase an NFT listed for sale.
     * @param _saleId Unique sale identifier.
     * Requirements:
     * - The sale must be unstopped for successful execution.
     * - The sender must not be an NFT seller.
     * - The sender's balance must be sufficient to cover the purchase price.
     * - The value sent must be greater than or equal to the sale price.
     * Actions:
     * - Transfers the payment to the seller, retaining the commission.
     * - Transfers ownership of the NFT to the buyer.
     * - Causes an event indicating the completion of the sale.
     * - Cancels the sale upon completion.
     */
    function buy(bytes32 _saleId) external payable 
        stoppedSale(_saleId) {
        _cancelSaleNewOwner(_saleId);
        require(!_senderSeller(sales[_saleId].seller));
        require(_senderBalance(getPrice(_saleId)));
        require(getPrice(_saleId) <= msg.value);
        sales[_saleId].seller.transfer(
            getPrice(_saleId) - (getPrice(_saleId) / 100));
        _transferToken(
            sales[_saleId].seller, 
            sales[_saleId].nftContract, 
            msg.sender,
            sales[_saleId].tokenId);
        emit SaleEnded(
            sales[_saleId].seller, 
            msg.sender,
            sales[_saleId].nftContract, 
            sales[_saleId].tokenId, 
            sales[_saleId].price, 
            block.timestamp);
        _cancel(_saleId);
    }  
}