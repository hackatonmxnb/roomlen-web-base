// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {LendingProtocol} from "./LendingProtocol.sol";
import {TokenReciboRoomlen} from "./TokenReciboRoomlen.sol";

/**
 * @title Secondary Market for Receipt NFTs
 * @author Equipo RoomLen
 * @notice Permite a los investors vender sus Receipt NFTs (posiciones de prestamista) a otros investors
 * @dev Marketplace P2P descentralizado con escrow integrado
 */
contract SecondaryMarket is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    TokenReciboRoomlen public immutable receiptNFT;
    IERC20 public immutable wmxnbToken;
    LendingProtocol public immutable lendingProtocol;

    uint16 public platformFeeBps = 250; // 2.5% platform fee

    struct Listing {
        uint256 receiptTokenId;
        address seller;
        uint96 askPrice;
        uint64 listedAt;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256[] public activeListings;

    event ReceiptListed(uint256 indexed tokenId, address indexed seller, uint96 price);
    event ReceiptSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint96 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event PlatformFeeUpdated(uint16 newFeeBps);

    constructor(
        address _receiptNFT,
        address _wmxnbToken,
        address _lendingProtocol,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_receiptNFT != address(0), "SM: Invalid receipt NFT");
        require(_wmxnbToken != address(0), "SM: Invalid token");
        require(_lendingProtocol != address(0), "SM: Invalid lending protocol");

        receiptNFT = TokenReciboRoomlen(_receiptNFT);
        wmxnbToken = IERC20(_wmxnbToken);
        lendingProtocol = LendingProtocol(_lendingProtocol);
    }

    /**
     * @notice Lista un Receipt NFT para venta en el mercado secundario
     * @param _tokenId El ID del Receipt NFT a vender
     * @param _price El precio de venta en wMXNB
     */
    function listReceipt(uint256 _tokenId, uint96 _price) external nonReentrant {
        require(receiptNFT.ownerOf(_tokenId) == msg.sender, "SM: No eres el propietario");
        require(_price > 0, "SM: Precio debe ser mayor a 0");
        require(!listings[_tokenId].active, "SM: Ya esta listado");

        // Validar que el loan sigue activo
        LendingProtocol.Loan memory loan = lendingProtocol.getLoan(_tokenId);
        require(loan.status == LendingProtocol.LoanStatus.Funded, "SM: Loan no activo");

        // Transfer NFT to market escrow
        receiptNFT.transferFrom(msg.sender, address(this), _tokenId);

        listings[_tokenId] = Listing({
            receiptTokenId: _tokenId,
            seller: msg.sender,
            askPrice: _price,
            listedAt: uint64(block.timestamp),
            active: true
        });

        activeListings.push(_tokenId);

        emit ReceiptListed(_tokenId, msg.sender, _price);
    }

    /**
     * @notice Compra un Receipt NFT del mercado secundario
     * @param _tokenId El ID del Receipt NFT a comprar
     */
    function buyReceipt(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];
        require(listing.active, "SM: No esta a la venta");
        require(msg.sender != listing.seller, "SM: No puedes comprar tu propio NFT");

        uint256 platformFee = (listing.askPrice * platformFeeBps) / 10000;
        uint256 sellerAmount = listing.askPrice - platformFee;

        // Transfer payment
        wmxnbToken.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        wmxnbToken.safeTransferFrom(msg.sender, owner(), platformFee);

        // Transfer NFT to buyer
        receiptNFT.transferFrom(address(this), msg.sender, _tokenId);

        listing.active = false;
        _removeFromActiveListings(_tokenId);

        emit ReceiptSold(_tokenId, listing.seller, msg.sender, listing.askPrice);
    }

    /**
     * @notice Cancela un listing y devuelve el NFT al seller
     * @param _tokenId El ID del Receipt NFT a cancelar
     */
    function cancelListing(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];
        require(listing.active, "SM: No esta listado");
        require(listing.seller == msg.sender, "SM: No eres el vendedor");

        // Return NFT to seller
        receiptNFT.transferFrom(address(this), msg.sender, _tokenId);

        listing.active = false;
        _removeFromActiveListings(_tokenId);

        emit ListingCancelled(_tokenId, msg.sender);
    }

    /**
     * @notice Calcula el precio sugerido basado en el valor restante del préstamo
     * @param _tokenId El ID del Receipt NFT
     * @return suggestedPrice El precio sugerido en wMXNB
     */
    function getSuggestedPrice(uint256 _tokenId) external view returns (uint96 suggestedPrice) {
        LendingProtocol.Loan memory loan = lendingProtocol.getLoan(_tokenId);

        require(loan.status == LendingProtocol.LoanStatus.Funded, "SM: Loan no activo");

        // Calcular valor restante (principal + interés acumulado)
        uint256 timeElapsed = block.timestamp - loan.fundingDate;
        uint256 totalTime = uint256(loan.termInMonths) * 30 days;

        (,LendingProtocol.RiskTierParams memory tier,) = lendingProtocol.getLoanUIData(_tokenId);

        // Interés total esperado
        uint256 totalInterest = (uint256(loan.amount) * tier.interestRateBps * totalTime) / (10000 * 365 days);
        uint256 totalValue = loan.amount + totalInterest;

        // Valor proporcional al tiempo restante
        uint256 remainingTime = (loan.dueDate > block.timestamp) ? (loan.dueDate - block.timestamp) : 0;
        uint256 remainingValue = (totalValue * remainingTime) / totalTime;

        // Aplicar descuento del 5% por liquidez inmediata
        suggestedPrice = uint96((remainingValue * 95) / 100);
    }

    /**
     * @notice Obtiene todos los listings activos
     * @return Array de token IDs listados
     */
    function getActiveListings() external view returns (uint256[] memory) {
        return activeListings;
    }

    /**
     * @notice Obtiene información detallada de un listing
     * @param _tokenId El ID del Receipt NFT
     */
    function getListingDetails(uint256 _tokenId) external view returns (
        Listing memory listing,
        LendingProtocol.Loan memory loan,
        uint96 suggestedPrice
    ) {
        listing = listings[_tokenId];
        loan = lendingProtocol.getLoan(_tokenId);
        suggestedPrice = this.getSuggestedPrice(_tokenId);
    }

    /**
     * @notice Actualiza la comisión de la plataforma (solo owner)
     * @param _newFeeBps Nueva comisión en basis points (ej: 250 = 2.5%)
     */
    function setPlatformFee(uint16 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 1000, "SM: Fee demasiado alto (max 10%)");
        platformFeeBps = _newFeeBps;
        emit PlatformFeeUpdated(_newFeeBps);
    }

    function _removeFromActiveListings(uint256 _tokenId) internal {
        for (uint i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == _tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }

    /**
     * @notice Permite al contrato recibir NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
