// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

/**
 * @author Brecht Devos - <brecht@loopring.org>
 * @notice Standard Base64 encoding library.
 */
library Base64 {
    string internal constant TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = TABLE;
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen);

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for { let i := 0 } lt(i, mload(data)) { } {
                i := add(i, 3)
                let input := mload(add(data, i))

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            let padding := mod(mload(data), 3)
            if gt(padding, 0) {
                resultPtr := sub(resultPtr, sub(3, padding))
                mstore(resultPtr, 0x3d3d000000000000000000000000000000000000000000000000000000000000)
            }
        }

        return result;
    }
}