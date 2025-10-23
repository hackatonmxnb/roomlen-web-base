// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";
import {IERC20Metadata} from "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {LendingProtocolV2} from "./LendingProtocolV2.sol";
import {VerifiableRentalAgreementNFTV2} from "./VerifiableRentalAgreementNFTV2.sol";
import {Base64} from "./lib/Base64.sol";

/**
 * @title Token de Recibo Roomlen V2 (TRR) - Optimizado para Base
 * @author Equipo RoomLen Firrton
 * @notice Este NFT (ERC721) representa la posición de un prestamista en el protocolo.       
 - SVG mejorado con información de token
 */
contract TokenReciboRoomlenV2 is ERC721, Ownable {
    address public lendingProtocolAddress;

    // EVENTS

    event Minted(uint256 indexed tokenId, address indexed owner, uint256 loanId);
    event Burned(uint256 indexed tokenId);
    event LendingProtocolUpdated(address indexed oldAddress, address indexed newAddress);

    // Base Builder event - automatically indexed by Base
    event BuilderCreated(address indexed builder);

    // ERRORS

    error OnlyLendingProtocol();
    error InvalidAddress();
    error TokenDoesNotExist();

    // MODIFIERS

    modifier onlyLendingProtocol() {
        if (msg.sender != lendingProtocolAddress) revert OnlyLendingProtocol();
        _;
    }

    // CONSTRUCTOR

    constructor(address _initialOwner, address _lendingProtocol)
        ERC721("Token Recibo Roomlen V2", "TRRv2")
        Ownable(_initialOwner)
    {
        if (_lendingProtocol == address(0)) revert InvalidAddress();
        lendingProtocolAddress = _lendingProtocol;
        emit LendingProtocolUpdated(address(0), _lendingProtocol);

        // Emit Base Builder event for protocol registration
        emit BuilderCreated(0x778b35106f7e79Ac51B76f4877fE1D60c214B001);
    }

    // LENDING PROTOCOL FUNCTIONS

    function mint(address to, uint256 loanId) external onlyLendingProtocol {
        _safeMint(to, loanId);
        emit Minted(loanId, to, loanId);
    }

    function burn(uint256 tokenId) external onlyLendingProtocol {
        _burn(tokenId);
        emit Burned(tokenId);
    }

    function setLendingProtocol(address _newAddress) external onlyOwner {
        if (_newAddress == address(0)) revert InvalidAddress();
        address oldAddress = lendingProtocolAddress;
        lendingProtocolAddress = _newAddress;
        emit LendingProtocolUpdated(oldAddress, _newAddress);
    }

    // METADATA FUNCTIONS - On-chain dynamic

    /**
     * @notice Genera el tokenURI dinámicamente on-chain
     * @dev Optimizado para Base, incluye información de stablecoin
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Optimización: Usar _ownerOf para validar existencia
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();

        LendingProtocolV2 protocol = LendingProtocolV2(lendingProtocolAddress);
        (
            LendingProtocolV2.Loan memory loan,
            LendingProtocolV2.RiskTierParams memory tier,
            VerifiableRentalAgreementNFTV2.AgreementData memory agreement
        ) = protocol.getLoanUIData(tokenId);

        string memory loanStatusStr = _getLoanStatusString(loan.status);
        string memory tokenSymbol = _getTokenSymbol(loan.tokenAddress);

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name": "Recibo RoomLen V2 #', Strings.toString(tokenId), '", ',
                    unicode'"description": "Este NFT representa el derecho a recibir el pago de un préstamo en el protocolo RoomLen en Base. Totalmente componible y transferible.", ',
                    '"attributes": [',
                        '{"trait_type": "Network", "value": "Base"}, ',
                        unicode'{"trait_type": "Monto Principal", "value": "', Strings.toString(loan.amount / 1e6), ' ', tokenSymbol, '"}, ',
                        unicode'{"trait_type": "Token", "value": "', tokenSymbol, '"}, ',
                        unicode'{"trait_type": "Interés Anual (APR)", "value": "', Strings.toString(tier.interestRateBps / 100), '%"}, ',
                        unicode'{"trait_type": "Plazo", "value": "', Strings.toString(loan.termInMonths), ' meses"}, ',
                        unicode'{"trait_type": "Estado", "value": "', loanStatusStr, '"}, ',
                        unicode'{"trait_type": "Propiedad", "value": "', agreement.propertyName, '"}, ',
                        unicode'{"trait_type": "Ubicación", "value": "', agreement.location, '"}, ',
                        unicode'{"display_type": "date", "trait_type": "Fecha de Vencimiento", "value": ', Strings.toString(loan.dueDate), '}',
                    '], ',
                    '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(buildSVG(loan, tier, tokenSymbol))), '"}'
                )
            )
        );

        return string.concat("data:application/json;base64,", json);
    }

    /**
     * @notice Construye el SVG dinámico del NFT
     * @dev Incluye información del token (USDT/USDC) y diseño optimizado
     */
    function buildSVG(
        LendingProtocolV2.Loan memory loan,
        LendingProtocolV2.RiskTierParams memory tier,
        string memory tokenSymbol
    ) internal pure returns (string memory) {
        string memory statusColor = _getStatusColor(loan.status);
        string memory statusText = _getLoanStatusString(loan.status);

        string memory svg = string.concat(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
                // Fondo con gradiente RoomLen (morado/violeta)
                '<defs>',
                    '<linearGradient id="roomlenGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
                        '<stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />',  // Morado RoomLen
                        '<stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />', // Morado oscuro
                    '</linearGradient>',
                '</defs>',
                '<rect width="100%" height="100%" rx="15" ry="15" fill="url(#roomlenGradient)"/>',

                // Estilos
                '<style>',
                    '.title { font: bold 22px sans-serif; fill: white; }',
                    '.subtitle { font: 14px sans-serif; fill: #DDD6FE; }',  // Lavanda claro
                    '.label { font: 14px sans-serif; fill: #E9D5FF; }',     // Lavanda
                    '.value { font: bold 18px sans-serif; fill: white; }',
                    '.badge { font: bold 14px sans-serif; fill: white; }',
                '</style>',

                // Header
                unicode'<text x="20" y="35" class="title">Recibo de Préstamo</text>',
                '<text x="20" y="55" class="subtitle">RoomLen V2 - Base Network</text>',
                '<rect x="20" y="65" width="360" height="2" fill="#A78BFA" opacity="0.5"/>',  // Morado claro

                // Monto Principal
                '<text x="20" y="100" class="label">Monto Principal:</text>',
                '<text x="20" y="125" class="value">', Strings.toString(loan.amount / 1e6), ' ', tokenSymbol, '</text>',

                // Tasa de Interés
                unicode'<text x="240" y="100" class="label">Interés (APR):</text>',
                '<text x="240" y="125" class="value">', Strings.toString(tier.interestRateBps / 100), '%</text>',

                // Plazo
                '<text x="20" y="165" class="label">Plazo:</text>',
                '<text x="20" y="190" class="value">', Strings.toString(loan.termInMonths), ' meses</text>',

                // Token Badge
                '<rect x="240" y="150" width="80" height="35" rx="8" ry="8" fill="#10B981" opacity="0.2"/>',
                '<rect x="240" y="150" width="80" height="35" rx="8" ry="8" fill="none" stroke="#10B981" stroke-width="2"/>',
                '<text x="280" y="173" class="badge" text-anchor="middle">', tokenSymbol, '</text>',

                // Estado
                unicode'<text x="20" y="235" class="label">Estado del Préstamo:</text>',
                '<rect x="18" y="245" width="120" height="40" rx="8" ry="8" fill="', statusColor, '"/>',
                '<text x="78" y="272" class="badge" text-anchor="middle">', statusText, '</text>',

                // Footer con logo RoomLen
                '<text x="20" y="375" font-size="12" fill="white" opacity="0.6">Powered by RoomLen</text>',
                // Logo RoomLen simplificado (R en círculo)
                '<circle cx="365" cy="370" r="22" fill="white" opacity="0.15"/>',
                '<text x="365" y="378" font-size="24" font-weight="bold" text-anchor="middle" fill="white" opacity="0.8">R</text>',
            '</svg>'
        );
        return svg;
    }

    // HELPER FUNCTIONS
    /**
     * @notice Convierte el estado del préstamo a una cadena legible
     */

    function _getLoanStatusString(LendingProtocolV2.LoanStatus status) internal pure returns (string memory) {
        if (status == LendingProtocolV2.LoanStatus.Requested) return "Solicitado";
        if (status == LendingProtocolV2.LoanStatus.Funded) return "Activo";
        if (status == LendingProtocolV2.LoanStatus.Repaid) return "Pagado";
        if (status == LendingProtocolV2.LoanStatus.Defaulted) return "Default";
        return "Desconocido";
    }

    function _getStatusColor(LendingProtocolV2.LoanStatus status) internal pure returns (string memory) {
        if (status == LendingProtocolV2.LoanStatus.Requested) return "#F59E0B"; // Amarillo
        if (status == LendingProtocolV2.LoanStatus.Funded) return "#10B981"; // Verde
        if (status == LendingProtocolV2.LoanStatus.Repaid) return "#3B82F6"; // Azul
        if (status == LendingProtocolV2.LoanStatus.Defaulted) return "#EF4444"; // Rojo
        return "#6B7280"; // Gris
    }

    /**
     * @notice Determina el símbolo del token dinámicamente
     * @dev Intenta leer el symbol() del contrato ERC20, con fallback a "TOKEN"
     * @param tokenAddress Dirección del token ERC20
     */
    function _getTokenSymbol(address tokenAddress) internal view returns (string memory) {
        // Intentar obtener el símbolo dinámicamente
        try IERC20Metadata(tokenAddress).symbol() returns (string memory symbol) {
            // Validar que el símbolo no esté vacío
            if (bytes(symbol).length > 0) {
                return symbol;
            }
        } catch {
            // Si falla, intentar con addresses conocidas como fallback
            if (tokenAddress == 0x036CbD53842c5426634e7929541eC2318f3dCF7e) return "USDC";
            if (tokenAddress == 0xf8b6097E8c1adFa8B2f37c5876Ed07E87Dcf2C3C) return "USDT";
        }

        // Fallback genérico
        return "TOKEN";
    }
}
