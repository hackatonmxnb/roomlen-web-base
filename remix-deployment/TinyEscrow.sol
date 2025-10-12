// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TinyEscrow - ULTRA MINIMAL VERSION
 * @author Equipo RoomLen - LATIN HACK 2025
 * @notice P2P Escrow para TRR NFTs - SIN IMPORTS
 * @dev ~3KB - Garantizado que funciona en Paseo
 *
 * DEPLOYMENT (2 PARAMETROS):
 * _nft:     0xC542E39374e63836B2307034E29cceE435A65545
 * _token:   0xF48A62Fd563b3aBfDBA8542a484bb87183ef6342
 */

// Interfaces mínimas (sin imports)
interface IERC721Minimal {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract TinyEscrow {
    IERC721Minimal public trrNFT;
    IERC20Minimal public wmxnb;

    event Trade(uint256 tokenId, address seller, address buyer, uint256 price);

    constructor(address _nft, address _token) {
        trrNFT = IERC721Minimal(_nft);
        wmxnb = IERC20Minimal(_token);
    }

    /**
     * @notice Ejecuta trade P2P seguro
     * @dev Requiere aprobaciones previas:
     *      - Seller: trrNFT.approve(escrow, tokenId)
     *      - Buyer: wmxnb.approve(escrow, price)
     */
    function trade(
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price
    ) external {
        require(trrNFT.ownerOf(tokenId) == seller, "Not owner");
        require(wmxnb.transferFrom(buyer, seller, price), "Payment failed");
        trrNFT.transferFrom(seller, buyer, tokenId);
        emit Trade(tokenId, seller, buyer, price);
    }
}
