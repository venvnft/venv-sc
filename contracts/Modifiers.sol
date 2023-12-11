// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./Libraries.sol";
import "./VeneraCore.sol";

contract Modifiers is VeneraCore {
    using ArrayExt for uint[];

    /**
     * @dev Modifier to check if the caller has delegated token ownership or approval.
     * @param _nftContract Address of the ERC721 or ERC1155 contract.
     * @param _tokenId ID of the token.
     * Requirements:
     * - Checks if the contract supports ERC721 or ERC1155 interfaces.
     * - Verifies if the caller is approved for all tokens through `isApprovedForAll`.
     * - Reverts with "Token not delegate" if the caller doesn't have the necessary approval.
     */
    modifier hasDelegated(address _nftContract, uint _tokenId) {
        if (_supportsInterface(_nftContract, type(IERC721).interfaceId)) {
            require(
                IERC721(_nftContract).isApprovedForAll(msg.sender, address(this)) == true,
                "Token not delegate");
        } else if (_supportsInterface(_nftContract, type(IERC1155).interfaceId)) {
            require(
                IERC1155(_nftContract).isApprovedForAll(msg.sender, address(this)) == true,
                "Token not delegate");
        }
        _;
    }

    /**
     * @dev Modifier to validate the duration of a deal.
     * @param _duration The duration of the deal.
     * Requirements:
     * - Checks if the provided duration is at least 12 hours and at most 365 days.
     * - Reverts with "Invalid duration" if the provided duration doesn't meet the requirements.
     */
    modifier durationValid(uint _duration) {
        require(
            _duration >= 12 hours &&
            _duration <= 365 days,
            "Invalid duration");
        _;
    }

    /**
     * @dev Modifier to validate ownership of a specific token by the caller.
     * @param _nftContract The address of the ERC721 contract.
     * @param _tokenId The ID of the token being validated.
     * Requirements:
     * - Checks if the caller owns the specified token based on the ERC721 contract.
     * - Reverts with "Doesn't own the token" if the caller doesn't own the token.
     */
    modifier ownerValid(address _nftContract, uint _tokenId) {
        require(IERC721(_nftContract).ownerOf(_tokenId) == msg.sender, 
            "Doesn't own the token");
        _;
    }

    /**
     * @dev Modifier to validate ownership of a specific quantity of tokens by the caller in an ERC1155 contract.
     * @param _nftContract The address of the ERC1155 contract.
     * @param _tokenId The ID of the token being validated.
     * @param _quantity The quantity of tokens being validated.
     * Requirements:
     * - Checks if the caller owns at least the specified quantity of tokens based on the ERC1155 contract.
     * - Reverts with "Doesn't own enough tokens" if the caller doesn't own the required amount of tokens.
     */
    modifier ownerMultiValid(address _nftContract, uint _tokenId, uint _quantity) {
        require(IERC1155(_nftContract).balanceOf(
                msg.sender, _tokenId) >= _quantity, 
                "Doesn't own enough tokens");
        _;
    }

    /**
     * @dev Modifier to ensure that the provided address for an NFT contract is valid and not a zero address.
     * @param _nftContract The address of the NFT contract being validated.
     * Requirements:
     * - Ensures that the provided NFT contract address is not a zero address.
     * - Reverts with "Zero address" if the provided address is a zero address.
     */
    modifier contractValid(address _nftContract) {
        require(_nftContract != address(0), "Zero address");
        _;
    }

    /**
     * @dev Modifier to validate that the provided price for an auction or transaction is not zero.
     * @param _price The price being validated.
     * Requirements:
     * - Ensures that the provided price is not zero.
     * - Reverts with "Invalid price" if the provided price is zero.
     */
    modifier priceValid(uint _price) {
        require(_price != 0, "Invalid price");
        _;
    }

    /**
     * @dev Modifier to ensure that the provided quantity for an auction or transaction is not zero.
     * @param _quantity The quantity being validated.
     * Requirements:
     * - Verifies that the provided quantity is not zero.
     * - Reverts with "Invalid quantity" if the provided quantity is zero.
     */
    modifier quantityValid(uint _quantity) {
        require(_quantity != 0, "Invalid quantity");
        _;
    }

    /**
     * @dev Modifier to ensure that the provided array of token IDs does not contain duplicates.
     * @param _tokenId The array of token IDs being validated.
     * Requirements:
     * - Checks for duplicate values within the array of token IDs.
     * - Reverts with "Duplicate token found" if any duplicates are detected.
     */
    modifier tokensDup(uint[] calldata _tokenId) {
        require(!_tokenId._duplicArray(), "Duplicate token found");
        _;
    }
}