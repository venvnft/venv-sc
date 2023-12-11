// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./IVeneraAuction.sol";
import "./Modifiers.sol"; 

contract VeneraAuction is IVeneraAuction, Modifiers {
    mapping(bytes32 => Auction) public auctions;

    /**
     * @dev Modifies a function to ensure that the auction identified by `_saleId` has ended.
     * @param _saleId The unique identifier of the auction.
     * Requirements:
     * - Checks if the auction's end time has passed to allow the function to proceed.
     */
    modifier stoppedAuc(bytes32 _saleId) {
        require(
            _stopped(auctions[_saleId].endTime), 
            "Auction ended");
        _;
    }

    /**
     * @notice Initiates auctions for multiple ERC1155 tokens in batches.
     * @param _nftContract Address of the ERC1155 contract.
     * @param _tokenId Array of token IDs to be auctioned.
     * @param _quantity Array of quantities for each token ID to be auctioned.
     * @param _price Array of starting prices for each token ID.
     * @param _duration Array of durations for the auctions of each token ID.
     * @dev This function initiates auctions for multiple ERC1155 tokens simultaneously.
     *      It ensures that input array lengths match and are valid, then iterates through each token to initiate an auction.
     *      The `auctionMulti` function is called for each token ID in the loop.
     */
    function auctionMultiBatch(
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
            auctionMulti(_nftContract, _tokenId[i], _quantity[i], _price[i], _duration[i]);   
        }
    }   

    /**
     * @notice Initiates an auction for multiple quantities of an ERC1155 token.
     * @param _nftContract Address of the ERC1155 contract.
     * @param _tokenId Token ID to be auctioned in multiple quantities.
     * @param _quantity Quantity of tokens to be auctioned.
     * @param _price Sale price for each token.
     * @param _duration Duration of the auction for the specified token.
     * @dev This function approves the contract for transfer and initiates auctions for multiple quantities
     *      of the specified token by invoking the `_auction` function for each individual token.
     *      It ensures a valid contract, valid ownership of the specified tokens in the given quantity,
     *      a valid sale price, and a valid sale quantity. Emits an `AuctionCreate` event for each successful auction initiation.
     */
    function auctionMulti(
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
            _auction(_getSaleId(_nftContract, _tokenId, i), _nftContract, _tokenId, _price, _duration);
        }
    }    

    /**
     * @notice Initiates auctions for multiple ERC721 tokens.
     * @param _nftContract Address of the ERC721 NFT contract.
     * @param _tokenId Array of token IDs of the ERC721 tokens to be auctioned.
     * @param _price Array of auction prices for the corresponding tokens.
     * @param _duration Array of durations for the auctions of the corresponding tokens.
     * @dev This function creates auctions for multiple ERC721 tokens simultaneously.
     *      It ensures that input lengths match and are valid, then iterates through each token to initiate an auction.
     *      The `auction` function is called for each token ID in the loop.
     * @dev This function is meant for ERC721 tokens.
     */
    function auctionBatch(
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
            auction(_nftContract, _tokenId[i], _price[i], _duration[i]);   
        }
    }        

    /**
     * @notice Initiates an auction for a single ERC721 token.
     * @param _nftContract Address of the ERC721 NFT contract.
     * @param _tokenId Token ID of the ERC721 token to be auctioned.
     * @param _price Auction price for the token.
     * @param _duration Duration of the auction for the specified token.
     * @dev This function ensures that the NFT contract is valid, the caller owns the specified ERC721 token, and the provided price is valid.
     *      It approves the contract to transfer the ERC721 token and calls the internal `_auction` function to create the auction.
     * @dev This function is meant for ERC721 tokens.
     */
    function auction(
        address _nftContract,
        uint _tokenId,
        uint _price,
        uint _duration) public 
        contractValid(_nftContract)
        ownerValid(_nftContract, _tokenId)
        priceValid(_price) {
        _approve(_nftContract);
        _auction(_getSaleId(_nftContract, _tokenId), _nftContract, _tokenId, _price, _duration);
    }    

    /**
     * @notice Internal function to create and store a new auction for an ERC721 token.
     * @param _saleId Unique identifier for the auction.
     * @param _nftContract Address of the ERC721 NFT contract.
     * @param _tokenId Token ID to be auctioned.
     * @param _price Starting price for the auction.
     * @param _duration Duration of the auction.
     * @dev This function creates a new `Auction` struct and stores it in the `auctions` mapping using the provided auction ID.
     *      It emits an `AuctionCreate` event to indicate the successful creation of an auction.
     * @dev Requires a valid sale duration and that the token has been delegated to the contract.
     */
    function _auction(
        bytes32 _saleId,
        address _nftContract,
        uint _tokenId,
        uint _price,
        uint _duration) internal
        durationValid(_duration) 
        hasDelegated(_nftContract, _tokenId) {
        Auction memory newAuction = Auction({
            seller: payable(msg.sender),
            nftContract: payable(_nftContract),
            tokenId: _tokenId,
            price: _price,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            highBidder: payable(address(0)),
            highBid: 0 });
        auctions[_saleId] = newAuction;
        emit AuctionCreate(_saleId, msg.sender, _nftContract, _tokenId, _price, _duration);
    }

    /**
     * @notice Function to cancel an ongoing auction and refund the seller's deposit.
     * @param _saleId Unique identifier of the auction to be canceled.
     * @dev This function cancels an auction identified by `_saleId`. It verifies that the auction is not stopped,
     *      the seller still owns the token, and the bidder's balance is sufficient to cover the fine.
     *      Upon successful verification, it refunds the auction's fine to the contract address and calls
     *      an internal function to cancel the auction.
     * @dev This function allows the seller to cancel the auction by paying the associated fine.
     */
    function cancelAuc(bytes32 _saleId) external payable stoppedAuc(_saleId) {
        _cancelAucNewOwner(_saleId);
        require(_senderSeller(auctions[_saleId].seller));
        require(_senderBalance(getAucFine(_saleId)));
        require(msg.value >= getAucFine(_saleId));
        _refundAuc(_saleId);
        payable(address(this)).transfer(getAucFine(_saleId));
        _cancelAuc(_saleId);
    }

    /**
     * @notice Function to place a bid in an ongoing auction.
     * @param _saleId Unique identifier of the auction to place a bid.
     * @dev This function allows users to bid on an active auction identified by `_saleId`.
     *      It verifies that the auction is not stopped, the bidder is not the seller,
     *      the bidder's balance is sufficient to cover the bid, and the bid amount exceeds the current highest bid.
     *      Upon successful verification, it refunds the previous highest bid, updates the new highest bidder
     *      and bid amount, and ends the auction.
     * @dev This function enables participants to place bids in auctions.
     */
    function bid(bytes32 _saleId) external payable stoppedAuc(_saleId) {
        _cancelAucNewOwner(_saleId);
        require(!_senderSeller(auctions[_saleId].seller));
        require(_senderBalance(getAucPrice(_saleId)));
        require(msg.value > auctions[_saleId].highBid);
        _refundAuc(_saleId);
        auctions[_saleId].highBidder = payable(msg.sender);
        auctions[_saleId].highBid = msg.value;
        endAuc(_saleId);
    }

    /**
     * @notice Function to finalize an auction once its duration ends.
     * @param _saleId Unique identifier of the auction to finalize.
     * @dev This function checks if the auction identified by `_saleId` has reached its end time.
     *      If the auction has ended and there is a valid highest bidder, it transfers the NFT to the bidder,
     *      transfers the payment to the seller, emits an event indicating the auction's completion, and cancels the auction.
     *      If there is no valid highest bidder, it simply cancels the auction.
     * @dev This function manages the finalization of auctions upon reaching their end time.
     */
    function endAuc(bytes32 _saleId) public {
        if (block.timestamp >= auctions[_saleId].endTime) {
            if (auctions[_saleId].highBidder != address(0)) {
                _transferToken(
                    auctions[_saleId].seller, 
                    auctions[_saleId].nftContract,
                    auctions[_saleId].highBidder,
                    auctions[_saleId].tokenId);
                auctions[_saleId].seller.transfer(
                    getAucPrice(_saleId) - (getAucPrice(_saleId) / 100));
                emit AuctionEnded(
                    auctions[_saleId].seller, 
                    auctions[_saleId].highBidder,
                    auctions[_saleId].nftContract,
                    auctions[_saleId].tokenId,
                    auctions[_saleId].highBid,
                    block.timestamp);
                _cancelAuc(_saleId);
            } else {
                _cancelAuc(_saleId);
            }
        }
    }

    /**
     * @notice Internal function to cancel an auction by removing it from the auctions mapping.
     * @param _saleId Unique identifier of the auction to cancel.
     * @dev This function removes the auction identified by `_saleId` from the auctions mapping.
     */
    function _cancelAuc(bytes32 _saleId) internal {
        delete auctions[_saleId];
    }

    /**
     * @notice Internal function to cancel an auction if the seller no longer owns the token.
     * @param _saleId Unique identifier of the auction to check and cancel if needed.
     * @dev This function verifies if the seller still owns the token associated with the auction identified by `_saleId`.
     *      If the seller no longer owns the token, it calls the internal `_cancelAuc` function to finalize the auction.
     */
    function _cancelAucNewOwner(bytes32 _saleId) internal {
        if (!_ownerToken(auctions[_saleId].seller, auctions[_saleId].nftContract, auctions[_saleId].tokenId)) {
            _cancelAuc(_saleId);
        }
    }

    /**
     * @notice Internal function to refund the highest bidder in an auction.
     * @param _saleId Unique identifier of the auction.
     * @dev This function refunds the highest bidder in the auction identified by `_saleId`.
     *      It transfers the bid amount back to the high bidder if there is one.
     */
    function _refundAuc(bytes32 _saleId) internal  {
        if (auctions[_saleId].highBidder != address(0)) {
            payable(auctions[_saleId].highBidder).transfer(auctions[_saleId].highBid);
        }
    }

    /**
     * @notice Function to retrieve auction details by its unique identifier.
     * @param _saleId The unique identifier of the auction.
     * @return Auction memory The details of the auction associated with the provided sale ID.
     * @dev This function retrieves auction information based on the provided sale ID.
     *      It ensures that the auction is not stopped and then returns the auction details from the `auctions` mapping.
     */
    function getAuc(bytes32 _saleId) external view stoppedAuc(_saleId) returns(Auction memory) {
        return auctions[_saleId];
    }

    /**
     * @notice Function to retrieve the current auction price based on its ID.
     * @param _saleId The unique identifier of the auction.
     * @return uint The current price of the auction associated with the provided sale ID.
     * @dev This function returns the current price of the auction identified by `_saleId`.
     *      If there's no high bidder yet, it returns the initial price set for the auction;
     *      otherwise, it returns the highest bid placed.
     */
    function getAucPrice(bytes32 _saleId) public view returns(uint) {
        if (auctions[_saleId].highBidder == address(0)) {
            return auctions[_saleId].price;
        } else {
            return auctions[_saleId].highBid;
        }
    }

    /**
     * @notice Function to retrieve the fine associated with an auction by its ID.
     * @param _saleId The unique identifier of the auction.
     * @return uint The calculated fine for the auction associated with the provided sale ID.
     * @dev This function calculates and returns the fine associated with the auction identified by `_saleId`.
     *      It computes the fine as 1/10th of the auction price obtained via `getAucPrice`.
     */
    function getAucFine(bytes32 _saleId) public view stoppedAuc(_saleId) returns(uint) {
        return getAucPrice(_saleId) / 10;
    }
}