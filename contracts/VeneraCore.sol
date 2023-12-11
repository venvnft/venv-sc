// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract VeneraCore {
    
    /**
     * @dev Checks if a contract supports a specific interface by querying the contract using `IERC165`.
     * @param contractAddress The address of the contract to check.
     * @param interfaceId The interface identifier.
     * @return Whether the contract supports the specified interface.
     */
    function _supportsInterface(address contractAddress, bytes4 interfaceId) internal view returns(bool) {
        (bool success, bytes memory result) = contractAddress.staticcall(
            abi.encodeWithSelector(IERC165.supportsInterface.selector, interfaceId));
        return success && (result.length > 0 && abi.decode(result, (bool)));
    }   

    /**
     * @dev Approves the current contract to manage tokens on behalf of the caller for a specific ERC721 contract.
     * @param _nftContract The address of the ERC721 contract.
     */
    function _approve(address _nftContract) public {
        IERC721(_nftContract).setApprovalForAll(address(this), true);
    }

    /**
     * @dev Grants approval to the current contract to manage tokens on behalf of the caller for a specific ERC1155 contract.
     * @param _nftContract The address of the ERC1155 contract.
     */
    function _approveMulti(address _nftContract) internal {
        IERC1155(_nftContract).setApprovalForAll(address(this), true);
    }

    /**
     * @dev Retrieves the owner's address of a specific token from an ERC721 contract.
     * @param _nftContract The address of the ERC721 contract.
     * @param _tokenId The ID of the token.
     * @return The address of the token's owner.
     */
    function _ownToken(address _nftContract, uint _tokenId) internal view returns(address) {
        return IERC721(_nftContract).ownerOf(_tokenId);
    }

    /**
     * @dev Retrieves the balance of a specific token owned by an address within an ERC1155 contract.
     * @param _owner The address of the token owner.
     * @param _nftContract The address of the ERC1155 contract.
     * @param _tokenId The ID of the token.
     * @return The balance of the specified token owned by the address.
     */
    function _balanceToken(address _owner, address _nftContract, uint _tokenId) internal view returns(uint) {
        return IERC1155(_nftContract).balanceOf(_owner, _tokenId);
    }

    /**
     * @dev Checks if an address has a valid balance of a specific token within an ERC1155 contract.
     * @param _owner The address of the token owner.
     * @param _nftContract The address of the ERC1155 contract.
     * @param _tokenId The ID of the token.
     * @return A boolean indicating if the address has a valid token balance (greater than or equal to 1).
     */
    function _validTokenBalance(address _owner, address _nftContract, uint _tokenId) internal view returns(bool) {
        return _balanceToken(_owner, _nftContract, _tokenId) >= 1;
    }    

    /**
     * @dev Generates a unique sale identifier based on the contract address, token ID, sender's address, and timestamp.
     * @param _nftContract The address of the NFT contract.
     * @param _tokenId The ID of the token being sold.
     * @return A unique bytes32 identifier for the sale.
     */
    function _getSaleId(address _nftContract, uint _tokenId) internal view returns(bytes32) {
        return keccak256(abi.encodePacked(_nftContract, _tokenId, msg.sender, block.timestamp));
    }

    /**
     * @dev Generates a unique sale identifier based on the contract address, token ID, sender's address, quantity, and timestamp.
     * @param _nftContract The address of the NFT contract.
     * @param _tokenId The ID of the token being sold.
     * @param _quantity The quantity of tokens being sold.
     * @return A unique bytes32 identifier for the sale.
     */
    function _getSaleId(address _nftContract, uint _tokenId, uint _quantity) internal view returns(bytes32) {
        return keccak256(abi.encodePacked(_nftContract, _tokenId, msg.sender, _quantity, block.timestamp));
    }

    /**
     * @dev Transfers tokens from seller to buyer based on token interface support.
     * @param _seller The address of the seller.
     * @param _nftContract The address of the NFT contract.
     * @param _buyer The address of the buyer.
     * @param _tokenId The ID of the token being transferred.
     */
    function _transferToken(address _seller, address _nftContract, address _buyer, uint _tokenId) internal {
        if (_supportsInterface(_nftContract, type(IERC721).interfaceId)) {
            IERC721(_nftContract).safeTransferFrom(_seller, _buyer, _tokenId);
        } else if (_supportsInterface(_nftContract, type(IERC1155).interfaceId)) {
            IERC1155(_nftContract).safeTransferFrom(_seller, _buyer, _tokenId, 1, "");
        }
    }  

    /**
     * @dev Checks if the message sender is the specified seller.
     * @param _seller The address of the seller to check against the message sender.
     * @return A boolean indicating whether the message sender is the specified seller or not.
     */
    function _senderSeller(address _seller) internal view returns(bool) {
        return _seller == msg.sender;
    }

    /**
     * @dev Checks if the specified token belongs to the specified seller.
     * @param _seller The address of the seller to check ownership against.
     * @param _nftContract The address of the NFT contract.
     * @param _tokenId The ID of the token to check ownership of.
     * @return A boolean indicating whether the token belongs to the specified seller or not.
     */
    function _ownSeller(address _seller, address _nftContract, uint _tokenId) internal view returns(bool) {
        return _ownToken(_nftContract, _tokenId) == _seller;
    }

    /**
     * @dev Checks if the specified time has passed.
     * @param _time The time to compare against the current block's timestamp.
     * @return A boolean indicating whether the specified time has passed or not.
     */
    function _stopped(uint _time) internal view returns(bool) {
        return block.timestamp <= _time;
    }

    /**
     * @dev Checks if the sender's balance is sufficient for a specified price.
     * @param _price The price to compare against the sender's balance.
     * @return A boolean indicating whether the sender's balance is greater than or equal to the specified price.
     */
    function _senderBalance(uint _price) internal view returns(bool) {
        return msg.sender.balance >= _price;
    }

    /**
     * @dev Checks ownership of a token for a specific seller in an NFT contract.
     * @param _seller The address of the seller.
     * @param _nftContract The address of the NFT contract.
     * @param _tokenId The ID of the token to check ownership for.
     * @return A boolean indicating ownership of the token by the seller in the specified NFT contract.
     */
    function _ownerToken(address _seller, address _nftContract, uint _tokenId) internal view returns(bool) {
        if (_supportsInterface(_nftContract, type(IERC721).interfaceId)) {
            return _ownSeller(_seller, _nftContract, _tokenId);
        } else if (_supportsInterface(_nftContract, type(IERC1155).interfaceId)) {
            return _validTokenBalance(_seller, _nftContract, _tokenId);
        }
    }
}