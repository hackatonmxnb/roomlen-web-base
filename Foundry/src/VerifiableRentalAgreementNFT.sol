// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title Verifiable Rental Agreement NFT (VRA)
 * @author RoomLen Team
 * @notice NFT (ERC721) que representa un contrato de alquiler verificado del mundo real.
 * @dev La acuñación está restringida al `owner` para simular un proceso de curación de activos.
 *      Se usa un contador uint256 simple para los IDs de token en lugar de la librería Counters.
 */
contract VerifiableRentalAgreementNFT is ERC721, Ownable {
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

    event AgreementTokenized(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 agreementId
    );

    constructor(address initialOwner)
        ERC721("Verifiable Rental Agreement", "VRA")
        Ownable(initialOwner)
    {}

    function mint(
        address owner,
        uint32 agreementId,
        uint96 rentAmount,
        uint16 termMonths,
        uint8 tenantScore,
        string calldata propertyName,
        string calldata location
    ) public onlyOwner returns (uint256) {
        require(tenantScore <= 100, "VRA: Score must be between 0 and 100");
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

    function getAgreementData(uint256 tokenId) external view returns (AgreementData memory) {
        ownerOf(tokenId);
        return agreementDetails[tokenId];
    }
}