// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

/**
 * @title NFT de Contrato de Alquiler Verificable (VRA) - v2 (Gas Optimized)
 * @author Equipo RoomLen
 * @notice Representa un contrato de alquiler del mundo real como un NFT (ERC721).
 * @dev Híbrido: Almacena datos críticos para la lógica on-chain y el resto en un URI off-chain para optimizar gas.
 *      La acuñación está restringida al `owner` del contrato.
 */
contract VerifiableRentalAgreementNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct AgreementData {
        uint96 rentAmount;      // Monto del alquiler en la menor unidad de la moneda.
        uint16 termMonths;      // Plazo del contrato en meses.
        uint8 tenantScore;      // Puntuación de riesgo del inquilino (0-100).
    }

    mapping(uint256 => AgreementData) public agreementDetails;

    event AgreementTokenized(uint256 indexed tokenId, address indexed owner, string tokenURI);

    constructor(address initialOwner)
        ERC721("Verifiable Rental Agreement", "VRA")
        Ownable(initialOwner)
    {}

    /**
     * @notice Acuña un nuevo NFT que representa un contrato de alquiler.
     * @dev Solo puede ser llamado por el `owner`.
     * @param owner La dirección que recibirá el NFT.
     * @param tokenURI El URI que apunta al archivo de metadatos JSON (con propertyName, location, etc.).
     * @param rentAmount Monto del alquiler mensual (para lógica on-chain).
     * @param termMonths Plazo del contrato en meses (para lógica on-chain).
     * @param tenantScore Puntuación de riesgo del inquilino (para lógica on-chain).
     * @return El ID del nuevo token acuñado.
     */
    function mint(
        address owner,
        string calldata tokenURI,
        uint96 rentAmount,
        uint16 termMonths,
        uint8 tenantScore
    ) public onlyOwner returns (uint256) {
        require(tenantScore <= 100, "VRA: La puntuacion debe ser entre 0 y 100");
        _tokenIdCounter++;
        uint256 newItemId = _tokenIdCounter;

        _safeMint(owner, newItemId);
        _setTokenURI(newItemId, tokenURI);

        agreementDetails[newItemId] = AgreementData({
            rentAmount: rentAmount,
            termMonths: termMonths,
            tenantScore: tenantScore
        });

        emit AgreementTokenized(newItemId, owner, tokenURI);

        return newItemId;
    }

    /**
     * @notice Obtiene los datos críticos asociados a un NFT para la lógica on-chain.
     * @dev revierte si el `tokenId` no existe.
     * @param tokenId El ID del token a consultar.
     * @return Una estructura con los metadatos críticos del contrato.
     */
    function getAgreementData(uint256 tokenId) external view returns (AgreementData memory) {
        require(_exists(tokenId), "VRA: Consulta por un token que no existe");
        return agreementDetails[tokenId];
    }

    /**
     * @notice Permite al owner quemar un token.
     */
    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    // La función tokenURI es heredada directamente de ERC721URIStorage.
    // Se necesita sobreescribir supportsInterface para que el contrato anuncie que soporta ERC721URIStorage.
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
