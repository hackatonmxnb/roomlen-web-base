// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";
import {LendingProtocol} from "./LendingProtocol.sol";
import {VerifiableRentalAgreementNFT} from "./VerifiableRentalAgreementNFT.sol";
import {Base64} from "./lib/Base64.sol";

/**
 * @title Token de Recibo Roomlen (TRR)
 * @author Equipo RoomLen
 * @notice Este NFT (ERC721) representa la posición de un prestamista en el protocolo.
 * @dev Es un activo componible que encapsula el derecho a recibir el repago de un préstamo. 
 *      Implementa una función tokenURI dinámica para mostrar los metadatos del préstamo on-chain.
 */
contract TokenReciboRoomlen is ERC721, Ownable {
    address public lendingProtocolAddress;

    event Minted(uint256 indexed tokenId, address indexed owner, uint256 loanId);
    event Burned(uint256 indexed tokenId);

    modifier onlyLendingProtocol() {
        require(msg.sender == lendingProtocolAddress, "TRR: Solo el contrato de protocolo puede llamar esta funcion");
        _;
    }

    constructor(address _initialOwner)
        ERC721("Token Recibo Roomlen", "TRR")
        Ownable(_initialOwner)
    {}

    function mint(address to, uint256 loanId) external onlyLendingProtocol {
        _safeMint(to, loanId);
        emit Minted(loanId, to, loanId);
    }

    function burn(uint256 tokenId) external onlyLendingProtocol {
        _burn(tokenId);
        emit Burned(tokenId);
    }

    function setLendingProtocol(address _newAddress) external onlyOwner {
        lendingProtocolAddress = _newAddress;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId); // La llamada a ownerOf revierte si el token no existe, actuando como la verificación necesaria.

        LendingProtocol protocol = LendingProtocol(lendingProtocolAddress);
        (LendingProtocol.Loan memory loan, LendingProtocol.RiskTierParams memory tier, VerifiableRentalAgreementNFT.AgreementData memory agreement) = protocol.getLoanUIData(tokenId);

        string memory loanStatusStr = "Activo";
        if (loan.status == LendingProtocol.LoanStatus.Repaid) {
            loanStatusStr = "Pagado";
        } else if (loan.status == LendingProtocol.LoanStatus.Defaulted) {
            loanStatusStr = "Default";
        }

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name": "Recibo RoomLen #', Strings.toString(tokenId), '", ',
                    unicode'"description": "Este NFT representa el derecho a recibir el pago de un préstamo en el protocolo RoomLen.", ',
                    '"attributes": [',
                        unicode'{"trait_type": "Monto Principal", "value": ', Strings.toString(loan.amount / 1e18), ' "wMXNB"}, ',
                        unicode'{"trait_type": "Interés Anual (APR)", "value": ', Strings.toString(tier.interestRateBps / 100), '"%"}, ',
                        unicode'{"trait_type": "Plazo", "value": ', Strings.toString(loan.termInMonths), ' "meses"}, ',
                        unicode'{"trait_type": "Estado", "value": "', loanStatusStr, '"}, ',
                        unicode'{"trait_type": "Propiedad", "value": "', agreement.propertyName, '"}, ',
                        unicode'{"display_type": "date", "trait_type": "Fecha de Vencimiento", "value": ', Strings.toString(loan.dueDate), '}',
                    '], ',
                    '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(buildSVG(loan, tier))), '"}'
                )
            )
        );

        return string.concat("data:application/json;base64,", json);
    }

    function buildSVG(LendingProtocol.Loan memory loan, LendingProtocol.RiskTierParams memory tier) internal pure returns (string memory) {
        string memory statusColor = "#4CAF50"; // Verde para Activo
        if (loan.status == LendingProtocol.LoanStatus.Repaid) {
            statusColor = "#2196F3"; // Azul para Pagado
        } else if (loan.status == LendingProtocol.LoanStatus.Defaulted) {
            statusColor = "#F44336"; // Rojo para Default
        }
        
        string memory statusText = "Activo";
        if (loan.status == LendingProtocol.LoanStatus.Repaid) {
            statusText = "Pagado";
        } else if (loan.status == LendingProtocol.LoanStatus.Defaulted) {
            statusText = "Default";
        }

        string memory svg = string.concat(
            '<svg width="350" height="350" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="100%" height="100%" rx="10" ry="10" fill="#1E293B"/>',
                '<style>.title { font: bold 20px sans-serif; fill: white; } .label { font: 14px sans-serif; fill: #94A3B8; } .value { font: bold 16px sans-serif; fill: white; }</style>',
                unicode'<text x="20" y="40" class="title">Recibo de Préstamo RoomLen</text>',
                '<rect x="20" y="60" width="310" height="2" fill="#334155"/>',
                '<text x="20" y="100" class="label">Monto Principal:</text>',
                '<text x="20" y="125" class="value">', Strings.toString(loan.amount / 1e18), ' wMXNB</text>',
                unicode'<text x="200" y="100" class="label">Interés (APR):</text>',
                '<text x="200" y="125" class="value">', Strings.toString(tier.interestRateBps / 100), '%</text>',
                '<text x="20" y="170" class="label">Estado:</text>',
                '<rect x="18" y="180" width="100" height="30" rx="5" ry="5" fill="', statusColor, '"/>',
                '<text x="68" y="200" font-weight="bold" text-anchor="middle" fill="white">', statusText, '</text>',
            '</svg>'
        );
        return svg;
    }
}