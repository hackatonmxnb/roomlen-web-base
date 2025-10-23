// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";
import {Base64} from "./lib/Base64.sol";

/**
 * @title NFT de Contrato de Alquiler Verificable V2 (VRA) - Optimizado para Base
 * @author Equipo RoomLen
 * @notice Representa un contrato de alquiler del mundo real como un NFT (ERC721).
 */
contract VerifiableRentalAgreementNFTV2 is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // STRUCTS

    struct AgreementData {
        string propertyName;        // Nombre de la propiedad
        string location;            // Ubicación
        uint96 rentAmount;          // Monto de renta mensual (en unidades del token, ej: 6 decimales para USDC)
        uint16 termMonths;          // Plazo en meses
        uint8 tenantScore;          // Score del inquilino (0-100)
        uint32 agreementId;         // ID del acuerdo off-chain
        address rentCurrency;       // Dirección del token de pago (USDT/USDC)
        uint64 startDate;           // Fecha de inicio del contrato
        uint64 endDate;             // Fecha de finalización del contrato
    }

    // STATE

    mapping(uint256 => AgreementData) public agreementDetails;

    // EVENTS

    event AgreementTokenized(
        uint256 indexed tokenId,
        address indexed owner,
        uint32 indexed agreementId,
        address rentCurrency,
        uint96 rentAmount
    );
    event AgreementBurned(uint256 indexed tokenId, uint32 indexed agreementId);

    // ERRORS

    error InvalidScore();
    error InvalidAddress();
    error InvalidDates();
    error TokenDoesNotExist();

    // CONSTRUCTOR

    constructor(address initialOwner)
        ERC721("Verifiable Rental Agreement V2", "VRAv2")
        Ownable(initialOwner)
    {}

    // MINTING FUNCTIONS

    /**
     * @notice Acuña un nuevo NFT que representa un contrato de alquiler
     * @dev Solo puede ser llamado por el owner. Optimizado para Base L2.
     */
    function mint(
        address owner,
        uint32 agreementId,
        uint96 rentAmount,
        uint16 termMonths,
        uint8 tenantScore,
        string calldata propertyName,
        string calldata location,
        address rentCurrency,
        uint64 startDate,
        uint64 endDate
    ) public onlyOwner returns (uint256) {
        if (tenantScore > 100) revert InvalidScore();
        if (rentCurrency == address(0)) revert InvalidAddress();
        if (endDate <= startDate) revert InvalidDates();

        _tokenIdCounter++;
        uint256 newItemId = _tokenIdCounter;

        _safeMint(owner, newItemId);

        agreementDetails[newItemId] = AgreementData({
            propertyName: propertyName,
            location: location,
            rentAmount: rentAmount,
            termMonths: termMonths,
            tenantScore: tenantScore,
            agreementId: agreementId,
            rentCurrency: rentCurrency,
            startDate: startDate,
            endDate: endDate
        });

        emit AgreementTokenized(newItemId, owner, agreementId, rentCurrency, rentAmount);

        return newItemId;
    }

    // BURN FUNCTIONS

    /**
     * @notice Permite al owner quemar un token
     * @dev Gas eficiente en Base L2
     */
    function burn(uint256 tokenId) public onlyOwner {
        uint32 agreementId = agreementDetails[tokenId].agreementId;
        _burn(tokenId);
        delete agreementDetails[tokenId];
        emit AgreementBurned(tokenId, agreementId);
    }

    // VIEW FUNCTIONS

    /**
     * @notice Obtiene los datos críticos asociados a un NFT para la lógica on-chain
     * @dev Revierte si el tokenId no existe
     */
    function getAgreementData(uint256 tokenId) external view returns (AgreementData memory) {
        if (ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return agreementDetails[tokenId];
    }

    /**
     * @notice Genera el tokenURI dinámicamente on-chain
     * @dev Metadatos completos con SVG personalizado
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();

        AgreementData memory data = agreementDetails[tokenId];
        string memory tokenSymbol = _getTokenSymbol(data.rentCurrency);

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name": "Contrato de Alquiler #', Strings.toString(tokenId), '", ',
                    unicode'"description": "NFT verificable que representa un contrato de alquiler real en la red Base. Puede ser usado como colateral en el protocolo RoomLen V2.", ',
                    '"attributes": [',
                        '{"trait_type": "Network", "value": "Base"}, ',
                        unicode'{"trait_type": "Propiedad", "value": "', data.propertyName, '"}, ',
                        unicode'{"trait_type": "Ubicación", "value": "', data.location, '"}, ',
                        unicode'{"trait_type": "Renta Mensual", "value": "', Strings.toString(data.rentAmount / 1e6), ' ', tokenSymbol, '"}, ',
                        unicode'{"trait_type": "Moneda", "value": "', tokenSymbol, '"}, ',
                        unicode'{"trait_type": "Plazo", "value": "', Strings.toString(data.termMonths), ' meses"}, ',
                        unicode'{"trait_type": "Score Inquilino", "value": ', Strings.toString(data.tenantScore), '}, ',
                        unicode'{"trait_type": "ID Acuerdo", "value": "', Strings.toString(data.agreementId), '"}, ',
                        unicode'{"display_type": "date", "trait_type": "Fecha Inicio", "value": ', Strings.toString(data.startDate), '}, ',
                        unicode'{"display_type": "date", "trait_type": "Fecha Fin", "value": ', Strings.toString(data.endDate), '}',
                    '], ',
                    '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(buildSVG(data, tokenSymbol))), '"}'
                )
            )
        );

        return string.concat("data:application/json;base64,", json);
    }

    /**
     * @notice Construye el SVG del NFT
     * @dev Diseño optimizado para Base con información completa
     */
    function buildSVG(AgreementData memory data, string memory tokenSymbol) internal pure returns (string memory) {
        string memory scoreColor = _getScoreColor(data.tenantScore);
        string memory scoreRating = _getScoreRating(data.tenantScore);

        string memory svg = string.concat(
            '<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">',
                // Fondo con gradiente
                '<defs>',
                    '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                        '<stop offset="0%" style="stop-color:#1E293B;stop-opacity:1" />',
                        '<stop offset="100%" style="stop-color:#0F172A;stop-opacity:1" />',
                    '</linearGradient>',
                    '<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">',
                        '<stop offset="0%" style="stop-color:#0052FF;stop-opacity:1" />',
                        '<stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />',
                    '</linearGradient>',
                '</defs>',
                '<rect width="100%" height="100%" rx="20" fill="url(#bg)"/>',

                // Barra superior con acento Base
                '<rect width="100%" height="60" fill="url(#accent)"/>',

                // Estilos
                '<style>',
                    '.title { font: bold 24px sans-serif; fill: white; }',
                    '.subtitle { font: 16px sans-serif; fill: #E0E7FF; }',
                    '.label { font: 13px sans-serif; fill: #94A3B8; }',
                    '.value { font: bold 16px sans-serif; fill: white; }',
                    '.badge-text { font: bold 14px sans-serif; fill: white; }',
                    '.small { font: 11px sans-serif; fill: #64748B; }',
                '</style>',

                // Header
                '<text x="20" y="35" class="title">Contrato de Alquiler</text>',

                // Propiedad
                '<text x="20" y="95" class="label">PROPIEDAD</text>',
                '<text x="20" y="120" class="value">', _truncateString(data.propertyName, 25), '</text>',

                // Ubicación
                unicode'<text x="20" y="155" class="label">UBICACIÓN</text>',
                '<text x="20" y="180" class="value">', _truncateString(data.location, 30), '</text>',

                // Línea divisoria
                '<line x1="20" y1="200" x2="380" y2="200" stroke="#334155" stroke-width="1"/>',

                // Renta Mensual
                '<text x="20" y="235" class="label">RENTA MENSUAL</text>',
                '<text x="20" y="265" class="value">', Strings.toString(data.rentAmount / 1e6), ' ', tokenSymbol, '</text>',

                // Plazo
                '<text x="240" y="235" class="label">PLAZO</text>',
                '<text x="240" y="265" class="value">', Strings.toString(data.termMonths), ' meses</text>',

                // Score del inquilino
                '<text x="20" y="310" class="label">SCORE INQUILINO</text>',
                '<rect x="18" y="320" width="150" height="50" rx="10" fill="', scoreColor, '" opacity="0.2"/>',
                '<rect x="18" y="320" width="150" height="50" rx="10" fill="none" stroke="', scoreColor, '" stroke-width="2"/>',
                '<text x="93" y="345" class="value" text-anchor="middle">', Strings.toString(data.tenantScore), '/100</text>',
                '<text x="93" y="362" class="badge-text" text-anchor="middle" opacity="0.8">', scoreRating, '</text>',

                // ID del Acuerdo
                '<text x="20" y="405" class="label">ID ACUERDO</text>',
                '<text x="20" y="428" class="value">#', Strings.toString(data.agreementId), '</text>',

                // Footer - Powered by Base
                '<rect y="450" width="100%" height="50" fill="#0052FF" opacity="0.1"/>',
                '<text x="200" y="478" class="small" text-anchor="middle">Powered by Base Network</text>',
                '<circle cx="360" cy="472" r="18" fill="white" opacity="0.2"/>',
                '<text x="360" y="478" font-size="16" font-weight="bold" text-anchor="middle" fill="white">B</text>',
            '</svg>'
        );
        return svg;
    }

    // HELPER FUNCTIONS

    function _getTokenSymbol(address tokenAddress) internal pure returns (string memory) {
        // Base Sepolia testnet addresses
        if (tokenAddress == 0x036CbD53842c5426634e7929541eC2318f3dCF7e) return "USDC";
        if (tokenAddress == 0xf8b6097E8c1adFa8B2f37c5876Ed07E87Dcf2C3C) return "USDT";
        return "TOKEN";
    }

    function _getScoreColor(uint8 score) internal pure returns (string memory) {
        if (score >= 80) return "#10B981"; // Verde - Excelente
        if (score >= 60) return "#F59E0B"; // Amarillo - Bueno
        if (score >= 40) return "#EF4444"; // Rojo - Regular
        return "#DC2626"; // Rojo oscuro - Malo
    }

    function _getScoreRating(uint8 score) internal pure returns (string memory) {
        if (score >= 80) return "Excelente";
        if (score >= 60) return "Bueno";
        if (score >= 40) return "Regular";
        return "Bajo";
    }

    function _truncateString(string memory str, uint256 maxLength) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        if (strBytes.length <= maxLength) return str;

        bytes memory truncated = new bytes(maxLength);
        for (uint i = 0; i < maxLength - 3; i++) {
            truncated[i] = strBytes[i];
        }
        truncated[maxLength - 3] = '.';
        truncated[maxLength - 2] = '.';
        truncated[maxLength - 1] = '.';

        return string(truncated);
    }

    // OVERRIDES

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
