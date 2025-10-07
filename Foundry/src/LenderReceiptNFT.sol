// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title Lender Receipt NFT (LRN)
 * @author RoomLen Team
 * @notice Este NFT (ERC721) representa el recibo de un inversor en el protocolo RoomLen.
 * @dev Es un activo componible que representa el derecho a recibir los pagos de un préstamo específico.
 *      El tokenId es igual al loanId en el contrato LendingProtocol.
 *      Solo el contrato LendingProtocol puede acuñar o quemar estos tokens.
 */
contract LenderReceiptNFT is ERC721, Ownable {
    address public lendingProtocol;

    event Minted(uint256 indexed tokenId, address indexed owner, uint256 loanId);
    event Burned(uint256 indexed tokenId);

    modifier onlyLendingProtocol() {
        require(msg.sender == lendingProtocol, "LRN: Caller is not the lending protocol");
        _;
    }

    constructor(address _initialOwner)
        ERC721("Lender Receipt NFT", "LRN")
        Ownable(_initialOwner)
    {
        lendingProtocol = address(0);
    }

    /**
     * @notice Acuña un nuevo token de recibo para un inversor.
     * @dev El tokenId utilizado es el mismo que el loanId para una fácil vinculación.
     *      Solo puede ser llamado por el contrato LendingProtocol.
     * @param to La dirección del inversor que financió el préstamo.
     * @param loanId El ID del préstamo en el contrato LendingProtocol.
     */
    function mint(address to, uint256 loanId) external onlyLendingProtocol {
        uint256 tokenId = loanId;
        _safeMint(to, tokenId);
        emit Minted(tokenId, to, loanId);
    }

    /**
     * @notice Quema un token de recibo después de que el préstamo ha sido pagado.
     * @dev Solo puede ser llamado por el contrato LendingProtocol.
     * @param tokenId El ID del token a quemar (igual al loanId).
     */
    function burn(uint256 tokenId) external onlyLendingProtocol {
        _burn(tokenId);
        emit Burned(tokenId);
    }

    /**
     * @notice Permite al propietario del contrato cambiar la dirección del LendingProtocol.
     */
    function setLendingProtocol(address _newAddress) external onlyOwner {
        lendingProtocol = _newAddress;
    }
}
