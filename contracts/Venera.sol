// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./VeneraSale.sol";
import "./VeneraAuction.sol";

/**
 * @title Venera
 * @custom:version 1.0.0
 * @author Kigrok (playa.arb)
 * @notice Smart contract serving as a marketplace for music in NFT format, 
 * facilitating sales and auctions for ERC721 and ERC1155 NFT.
*/

contract Venera is Ownable, VeneraSale, VeneraAuction {

    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {}

    /**
     * @notice Retrieves the current Ether balance of the contract.
     * @return uint The Ether balance of the contract.
     * @dev This function returns the current balance of the contract in Ether.
     */
    function getBalance() external view returns(uint) {
        return address(this).balance;
    }

    /**
     * @notice Allows the contract owner to withdraw the entire Ether balance.
     * @dev This function enables the contract owner to withdraw the entire Ether balance held by the contract.
     *      It requires that the contract holds a positive balance and transfers the funds to the contract owner.
     *      Restricted to the contract owner only.
     */
    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "No balance to withdraw");
        payable(owner()).transfer(address(this).balance);
    }
}