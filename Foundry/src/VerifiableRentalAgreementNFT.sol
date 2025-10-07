// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title NFT de Contrato de Alquiler Verificable (VRA)
 * @author Equipo RoomLen
 * @notice Representa un contrato de alquiler del mundo real como un NFT (ERC721).
 * @dev La acuñación está restringida al `owner` del contrato, simulando un proceso de curación de activos (asset onboarding).
 *      Los metadatos del contrato se almacenan on-chain para simplificar el acceso durante la hackathon.
 */
contract VerifiableRentalAgreementNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct AgreementData {
        string propertyName;    // Nombre o identificador de la propiedad.
        string location;        // Ubicación de la propiedad.
        uint96 rentAmount;      // Monto del alquiler en la menor unidad de la moneda.
        uint16 termMonths;      // Plazo del contrato en meses.
        uint8 tenantScore;      // Puntuación de riesgo del inquilino (0-100).
        uint32 agreementId;     // ID del contrato en un sistema externo.
    }

    mapping(uint256 => AgreementData) public agreementDetails;

    event AgreementTokenized(uint256 indexed tokenId, address indexed owner, uint32 agreementId);

    constructor(address initialOwner)
        ERC721("Verifiable Rental Agreement", "VRA")
        Ownable(initialOwner)
    {}

    /**
     * @notice Acuña un nuevo NFT que representa un contrato de alquiler.
     * @dev Solo puede ser llamado por el `owner` para mantener la integridad de los activos en el protocolo.
     * @param owner La dirección que recibirá el NFT.
     * @param agreementId ID del contrato en un sistema externo.
     * @param rentAmount Monto del alquiler mensual.
     * @param termMonths Plazo del contrato en meses.
     * @param tenantScore Puntuación de riesgo del inquilino (0-100).
     * @param propertyName Nombre de la propiedad.
     * @param location Ubicación de la propiedad.
     * @return El ID del nuevo token acuñado.
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
            agreementId: agreementId,
            rentAmount: rentAmount,
            termMonths: termMonths,
            tenantScore: tenantScore
        });

        emit AgreementTokenized(newItemId, owner, agreementId);

        return newItemId;
    }

    /**
     * @notice Obtiene los datos asociados a un NFT de contrato de alquiler específico.
     * @dev revierte si el `tokenId` no existe.
     * @param tokenId El ID del token a consultar.
     * @return Una estructura con todos los metadatos del contrato.
     */
    function getAgreementData(uint256 tokenId) external view returns (AgreementData memory) {
        ownerOf(tokenId); // La llamada a ownerOf revierte si el token no existe, actuando como la verificación necesaria.
        return agreementDetails[tokenId];
    }
}
