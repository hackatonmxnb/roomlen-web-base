// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

/**
 * @title NFT de Contrato de Alquiler Verificable (VRA) - v3
 * @author Equipo RoomLen
 * @notice Representa un contrato de alquiler del mundo real como un NFT (ERC721).
 * @dev Almacena todos los datos relevantes on-chain para ser consumidos por otros contratos.
 */
contract VerifiableRentalAgreementNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct AgreementData {
        string propertyName;
        string location;
        uint96 rentAmount;
        uint16 termMonths;
        uint8 tenantScore;
        uint32 agreementId;
    }

    mapping(uint256 => AgreementData) public agreementDetails;

    event AgreementTokenized(uint256 indexed tokenId, address indexed owner, uint32 agreementId);

    constructor(address initialOwner)
        ERC721("Verifiable Rental Agreement", "VRA")
        Ownable(initialOwner)
    {}

    /**
     * @notice Acuña un nuevo NFT que representa un contrato de alquiler.
     * @dev Solo puede ser llamado por el `owner`.
     */
    function mint(
        address owner,
        uint32 agreementId,
        uint96 rentAmount,
        uint16 termMonths,
        uint8 tenantScore,
        string calldata propertyName,
        string calldata location
    ) public onlyOwner returns (uint256) {
        require(tenantScore <= 100, "VRA: La puntuacion debe ser entre 0 y 100");
        _tokenIdCounter++;
        uint256 newItemId = _tokenIdCounter;

        _safeMint(owner, newItemId);

        agreementDetails[newItemId] = AgreementData({
            propertyName: propertyName,
            location: location,
            rentAmount: rentAmount,
            termMonths: termMonths,
            tenantScore: tenantScore,
            agreementId: agreementId
        });

        emit AgreementTokenized(newItemId, owner, agreementId);

        return newItemId;
    }

    /**
     * @notice Obtiene los datos críticos asociados a un NFT para la lógica on-chain.
     * @dev revierte si el `tokenId` no existe.
     */
    function getAgreementData(uint256 tokenId) external view returns (AgreementData memory) {
        _requireOwned(tokenId);
        return agreementDetails[tokenId];
    }

    /**
     * @notice Permite al owner quemar un token.
     */
    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}