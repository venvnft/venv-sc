// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

library ArrayExt {

    function _duplicArray(uint[] calldata arr) internal pure returns(bool) {
        for (uint i = 0; i < arr.length - 1; i++) {
            for (uint j = i + 1; j < arr.length; j++) {
                if (arr[i] == arr[j]) {
                    return true;
                }
            }
        }
        return false;
    }
}