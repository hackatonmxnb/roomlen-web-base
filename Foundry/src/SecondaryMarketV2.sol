// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/contracts/utils/Pausable.sol";
import {LendingProtocolV2} from "./LendingProtocolV2.sol";
import {TokenReciboRoomlenV2} from "./TokenReciboRoomlenV2.sol";

/**
 * @title Secondary Market for Receipt NFTs V2 - Optimizado para Base L2
 * @author Equipo RoomLen
 * @notice Permite a los investors vender sus Receipt NFTs (posiciones de prestamista) a otros investors
 * @dev V2 Features:
 *      - Optimizado para Base L2 (gas eficiente)
 *      - Soporte para Smart Wallets (ERC-4337)
 *      - Circuit breaker con pausabilidad
 *      - Eventos optimizados para indexación en Base
 *      - Batch operations para ahorrar gas
 *      - Protección contra liquidaciones durante listing
 */
contract SecondaryMarketV2 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // IMMUTABLE STATE
    TokenReciboRoomlenV2 public immutable receiptNFT;
    IERC20 public immutable wmxnbToken;
    LendingProtocolV2 public immutable lendingProtocol;

    // MUTABLE STATE
    uint16 public platformFeeBps = 250; // 2.5% platform fee
    uint16 public constant MIN_FEE_BPS = 10; // 0.1% minimum fee
    uint16 public constant MAX_FEE_BPS = 1000; // 10% maximum fee
    uint32 public constant MIN_LISTING_DURATION = 1 hours; // Anti front-running

    struct Listing {
        address seller;
        uint96 askPrice;
        uint64 listedAt;
        bool active;
    }

    // Optimización: Usar mapping en vez de array para activeListings
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) private _listingsBySeller;

    // EVENTS - Optimizados para indexación en Base

    event ReceiptListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint96 price,
        uint64 timestamp
    );

    event ReceiptSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint96 price,
        uint256 platformFee
    );

    event ListingCancelled(
        uint256 indexed tokenId,
        address indexed seller
    );

    event PlatformFeeUpdated(uint16 oldFeeBps, uint16 newFeeBps);

    event ListingPriceUpdated(
        uint256 indexed tokenId,
        address indexed seller,
        uint96 oldPrice,
        uint96 newPrice
    );

    // Base Builder event - automatically indexed by Base
    event BuilderCreated(address indexed builder);

    // ERRORS - Gas efficient

    error InvalidReceiptNFT();
    error InvalidToken();
    error InvalidLendingProtocol();
    error NotOwner();
    error InvalidPrice();
    error AlreadyListed();
    error NotForSale();
    error CannotBuyOwnNFT();
    error NotSeller();
    error LoanNotActive();
    error FeeTooLow();
    error FeeTooHigh();
    error ListingTooRecent();

    // CONSTRUCTOR

    constructor(
        address _receiptNFT,
        address _wmxnbToken,
        address _lendingProtocol,
        address _initialOwner
    ) Ownable(_initialOwner) {
        if (_receiptNFT == address(0)) revert InvalidReceiptNFT();
        if (_wmxnbToken == address(0)) revert InvalidToken();
        if (_lendingProtocol == address(0)) revert InvalidLendingProtocol();

        receiptNFT = TokenReciboRoomlenV2(_receiptNFT);
        wmxnbToken = IERC20(_wmxnbToken);
        lendingProtocol = LendingProtocolV2(_lendingProtocol);

        // Emit Base Builder event for protocol registration
        emit BuilderCreated(0x778b35106f7e79Ac51B76f4877fE1D60c214B001);
    }

    // CORE MARKETPLACE FUNCTIONS

    /**
     * @notice Lista un Receipt NFT para venta en el mercado secundario
     * @dev Optimizado para Base: Usa custom errors, validaciones mejoradas
     * @param _tokenId El ID del Receipt NFT a vender
     * @param _price El precio de venta en wMXNB
     */
    function listReceipt(uint256 _tokenId, uint96 _price) external nonReentrant whenNotPaused {
        if (receiptNFT.ownerOf(_tokenId) != msg.sender) revert NotOwner();
        if (_price == 0) revert InvalidPrice();
        if (listings[_tokenId].active) revert AlreadyListed();

        // Validar que el loan sigue activo
        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(_tokenId);
        if (loan.status != LendingProtocolV2.LoanStatus.Funded) revert LoanNotActive();

        // Transfer NFT to market escrow
        // SEGURIDAD: Esto revertirá si no hay approve(), evitando estado inconsistente
        receiptNFT.transferFrom(msg.sender, address(this), _tokenId);

        // Optimización: Usar memoria temporal antes de escribir a storage
        listings[_tokenId] = Listing({
            seller: msg.sender,
            askPrice: _price,
            listedAt: uint64(block.timestamp),
            active: true
        });

        _listingsBySeller[msg.sender].push(_tokenId);

        emit ReceiptListed(_tokenId, msg.sender, _price, uint64(block.timestamp));
    }

    /**
     * @notice Compra un Receipt NFT del mercado secundario
     * @dev V2: Optimizado con carga en memoria y unchecked math
     * @param _tokenId El ID del Receipt NFT a comprar
     */
    function buyReceipt(uint256 _tokenId) external nonReentrant whenNotPaused {
        // Optimización: Cargar a memoria una sola vez
        Listing memory listing = listings[_tokenId];

        if (!listing.active) revert NotForSale();
        if (msg.sender == listing.seller) revert CannotBuyOwnNFT();

        // Anti front-running: El listing debe estar activo por al menos MIN_LISTING_DURATION
        if (block.timestamp < listing.listedAt + MIN_LISTING_DURATION) {
            revert ListingTooRecent();
        }

        // Validar que el loan sigue activo (prevenir compra de NFT de loan liquidado)
        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(_tokenId);
        if (loan.status != LendingProtocolV2.LoanStatus.Funded) revert LoanNotActive();

        // Optimización: Usar unchecked para operaciones seguras (ahorra ~200 gas)
        uint256 platformFee;
        uint256 sellerAmount;
        unchecked {
            platformFee = (uint256(listing.askPrice) * platformFeeBps) / 10000;
            sellerAmount = listing.askPrice - platformFee;
        }

        // Transfer payment
        wmxnbToken.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        if (platformFee > 0) {
            wmxnbToken.safeTransferFrom(msg.sender, owner(), platformFee);
        }

        // Transfer NFT to buyer
        receiptNFT.transferFrom(address(this), msg.sender, _tokenId);

        // Optimización: Limpiar storage para obtener gas refund (~15,000 gas)
        delete listings[_tokenId];
        _removeFromSellerListings(listing.seller, _tokenId);

        emit ReceiptSold(_tokenId, listing.seller, msg.sender, listing.askPrice, platformFee);
    }

    /**
     * @notice Compra múltiples Receipt NFTs en una sola transacción
     * @dev Batch operation para ahorrar gas en costos base de transacción
     * @dev Ahorra ~21,000 gas por NFT adicional (costo base de tx)
     * @param _tokenIds Array de IDs de Receipt NFTs a comprar
     */
    function batchBuyReceipts(uint256[] calldata _tokenIds) external nonReentrant whenNotPaused {
        uint256 length = _tokenIds.length;

        for (uint256 i = 0; i < length;) {
            uint256 tokenId = _tokenIds[i];
            Listing memory listing = listings[tokenId];

            if (!listing.active) revert NotForSale();
            if (msg.sender == listing.seller) revert CannotBuyOwnNFT();

            // Validar que el loan sigue activo
            LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(tokenId);
            if (loan.status != LendingProtocolV2.LoanStatus.Funded) revert LoanNotActive();

            uint256 platformFee;
            uint256 sellerAmount;
            unchecked {
                platformFee = (uint256(listing.askPrice) * platformFeeBps) / 10000;
                sellerAmount = listing.askPrice - platformFee;
            }

            // Transfer payment
            wmxnbToken.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
            if (platformFee > 0) {
                wmxnbToken.safeTransferFrom(msg.sender, owner(), platformFee);
            }

            // Transfer NFT to buyer
            receiptNFT.transferFrom(address(this), msg.sender, tokenId);

            // Limpiar storage
            delete listings[tokenId];
            _removeFromSellerListings(listing.seller, tokenId);

            emit ReceiptSold(tokenId, listing.seller, msg.sender, listing.askPrice, platformFee);

            unchecked { ++i; }
        }
    }

    /**
     * @notice Cancela un listing y devuelve el NFT al seller
     * @param _tokenId El ID del Receipt NFT a cancelar
     */
    function cancelListing(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];

        if (!listing.active) revert NotForSale();
        if (listing.seller != msg.sender) revert NotSeller();

        // Return NFT to seller
        receiptNFT.transferFrom(address(this), msg.sender, _tokenId);

        // Optimización: Limpiar storage para obtener gas refund
        address seller = listing.seller;
        delete listings[_tokenId];
        _removeFromSellerListings(seller, _tokenId);

        emit ListingCancelled(_tokenId, seller);
    }

    /**
     * @notice Actualiza el precio de un listing existente
     * @dev Nueva funcionalidad V2: Permite ajustar precio sin re-listar
     * @param _tokenId El ID del Receipt NFT
     * @param _newPrice Nuevo precio de venta
     */
    function updateListingPrice(uint256 _tokenId, uint96 _newPrice) external nonReentrant {
        Listing storage listing = listings[_tokenId];

        if (!listing.active) revert NotForSale();
        if (listing.seller != msg.sender) revert NotSeller();
        if (_newPrice == 0) revert InvalidPrice();

        uint96 oldPrice = listing.askPrice;
        listing.askPrice = _newPrice;

        emit ListingPriceUpdated(_tokenId, msg.sender, oldPrice, _newPrice);
    }

    /**
     * @notice Función de emergencia para cancelar listing si el loan fue liquidado
     * @dev Permite a cualquiera limpiar listings de loans liquidados
     * @param _tokenId El ID del Receipt NFT
     */
    function cancelListingIfLiquidated(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];

        if (!listing.active) revert NotForSale();

        // Verificar si el loan fue liquidado o pagado
        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(_tokenId);
        if (loan.status == LendingProtocolV2.LoanStatus.Funded) revert LoanNotActive();

        // Si el loan no está activo, el NFT fue quemado - limpiar listing
        address seller = listing.seller;
        delete listings[_tokenId];
        _removeFromSellerListings(seller, _tokenId);

        emit ListingCancelled(_tokenId, seller);
    }

    // VIEW FUNCTIONS

    /**
     * @notice Calcula el precio sugerido basado en el valor restante del préstamo
     * @dev V2: Protegido contra underflow y validaciones mejoradas
     * @param _tokenId El ID del Receipt NFT
     * @return suggestedPrice El precio sugerido en wMXNB
     */
    function getSuggestedPrice(uint256 _tokenId) external view returns (uint96 suggestedPrice) {
        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(_tokenId);

        if (loan.status != LendingProtocolV2.LoanStatus.Funded) revert LoanNotActive();

        // Protección contra underflow: Si ya pasó la fecha de vencimiento, valor = 0
        if (block.timestamp >= loan.dueDate) {
            return 0;
        }

        // Optimización: Una sola llamada para obtener datos del loan
        (,LendingProtocolV2.RiskTierParams memory tier,) = lendingProtocol.getLoanUIData(_tokenId);

        // Calcular tiempo total
        uint256 totalTime = uint256(loan.termInMonths) * 30 days;

        // Optimización: Usar unchecked para operaciones seguras
        uint256 totalInterest;
        uint256 totalValue;
        uint256 remainingTime;
        uint256 remainingValue;

        unchecked {
            // Interés total esperado
            totalInterest = (uint256(loan.amount) * tier.interestRateBps * totalTime) / (10000 * 365 days);
            totalValue = loan.amount + totalInterest;

            // Valor proporcional al tiempo restante
            remainingTime = loan.dueDate - block.timestamp;
            remainingValue = (totalValue * remainingTime) / totalTime;

            // Aplicar descuento del 5% por liquidez inmediata
            suggestedPrice = uint96((remainingValue * 95) / 100);
        }
    }

    /**
     * @notice Obtiene todos los listings de un vendedor específico
     * @param _seller Dirección del vendedor
     * @return Array de token IDs listados por el vendedor
     */
    function getListingsBySeller(address _seller) external view returns (uint256[] memory) {
        return _listingsBySeller[_seller];
    }

    /**
     * @notice Obtiene información detallada de un listing
     * @param _tokenId El ID del Receipt NFT
     */
    function getListingDetails(uint256 _tokenId) external view returns (
        Listing memory listing,
        LendingProtocolV2.Loan memory loan,
        uint96 suggestedPrice
    ) {
        listing = listings[_tokenId];
        loan = lendingProtocol.getLoan(_tokenId);
        suggestedPrice = this.getSuggestedPrice(_tokenId);
    }

    /**
     * @notice Verifica si un NFT está listado
     * @param _tokenId El ID del Receipt NFT
     * @return true si está listado y activo
     */
    function isListed(uint256 _tokenId) external view returns (bool) {
        return listings[_tokenId].active;
    }

    // ADMIN FUNCTIONS

    /**
     * @notice Actualiza la comisión de la plataforma (solo owner)
     * @dev V2: Con validaciones de rango mejoradas
     * @param _newFeeBps Nueva comisión en basis points (ej: 250 = 2.5%)
     */
    function setPlatformFee(uint16 _newFeeBps) external onlyOwner {
        if (_newFeeBps < MIN_FEE_BPS) revert FeeTooLow();
        if (_newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();

        uint16 oldFeeBps = platformFeeBps;
        platformFeeBps = _newFeeBps;

        emit PlatformFeeUpdated(oldFeeBps, _newFeeBps);
    }

    /**
     * @notice Pausa el mercado en caso de emergencia
     * @dev Circuit breaker para seguridad
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reanuda el mercado
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // INTERNAL FUNCTIONS

    /**
     * @notice Remueve un tokenId del array de listings de un vendedor
     * @dev Optimización: Swap & pop para evitar shift de array
     * @param _seller Dirección del vendedor
     * @param _tokenId Token ID a remover
     */
    function _removeFromSellerListings(address _seller, uint256 _tokenId) internal {
        uint256[] storage sellerListings = _listingsBySeller[_seller];
        uint256 length = sellerListings.length;

        for (uint256 i = 0; i < length;) {
            if (sellerListings[i] == _tokenId) {
                // Swap con el último elemento y pop
                sellerListings[i] = sellerListings[length - 1];
                sellerListings.pop();
                break;
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Permite al contrato recibir NFTs
     * @dev Implementación de ERC721Receiver
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
