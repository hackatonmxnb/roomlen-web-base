// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title wMXNB Token - Wrapped MXNB for RoomLen Protocol
 * @notice SIMPLE ERC20 Token with public mint function for testnet
 * @dev Minimal implementation to avoid size limits on Paseo Testnet
 */

contract wMXNB {
    string public constant name = "Wrapped MXNB";
    string public constant symbol = "wMXNB";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @notice Mint tokens to any address (PUBLIC for testnet)
     * @param to Address to receive tokens
     * @param amount Amount to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) public {
        require(to != address(0), "mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /**
     * @notice Transfer tokens
     */
    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @notice Approve spender
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "approve to zero address");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Transfer from
     */
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(from != address(0), "transfer from zero address");
        require(to != address(0), "transfer to zero address");
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
