// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "openzeppelin-contracts/contracts/utils/Pausable.sol";
import {VerifiableRentalAgreementNFTV2} from "./VerifiableRentalAgreementNFTV2.sol";
import {TokenReciboRoomlenV2} from "./TokenReciboRoomlenV2.sol";

/**
 * @title Protocolo de Préstamos RoomLen V2 - Optimizado para Base
 * @author Equipo RoomLen
 * @notice Contrato principal que gestiona un mercado P2P de préstamos colateralizados por NFTs de contratos de alquiler.
 * @dev V2 Features:
 *      - Soporte multi-stablecoin (USDT, USDC, etc.)
 *      - Optimizado para Base L2 (gas eficiente)
 *      - Soporte para Smart Wallets (ERC-4337)
 *      - Circuit breaker con pausabilidad
 *      - Eventos optimizados para indexación en Base
 */
contract LendingProtocolV2 is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // STATE VARIABLES

    VerifiableRentalAgreementNFTV2 public immutable rentalNft;
    TokenReciboRoomlenV2 public lenderReceiptNft;

    enum LoanStatus { Requested, Funded, Repaid, Defaulted }

    // Stablecoins soportadas
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;

    struct Loan {
        uint256 nftId;          // ID del NFT colateralizado
        address borrower;       // Dirección del prestatario
        address lender;         // Dirección del prestamista
        address tokenAddress;   // Dirección del token (USDT/USDC)
        uint96 amount;          // Monto del préstamo
        uint64 fundingDate;     // Timestamp de fondeo
        uint64 dueDate;         // Timestamp de vencimiento
        uint16 termInMonths;    // Plazo en meses
        LoanStatus status;      // Estado del préstamo
    }

    struct RiskTierParams {
        uint8 scoreThreshold;       // Puntuación mínima
        uint16 haircutBps;          // Recorte de valor (basis points)
        uint16 ocBps;               // Sobrecolateralización (basis points)
        uint16 interestRateBps;     // Tasa de interés anual (basis points)
    }

    Loan[] public loans;
    mapping(uint256 => uint256) public loanIndexByNftId;
    RiskTierParams[] public riskTiers;

    mapping(address => uint256[]) private _loansByBorrower;
    mapping(address => uint256[]) private _fundedLoansByLender;

    // EVENTS - Optimizados para Base indexación

    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 indexed nftId,
        address tokenAddress,
        uint96 maxAdvance
    );

    event LoanFunded(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed lender,
        address tokenAddress,
        uint96 amount,
        uint16 interestRateBps
    );

    event LoanRepaid(uint256 indexed loanId, uint256 totalRepayment);
    event LoanDefaulted(uint256 indexed loanId, address indexed lender);
    event RiskTierSet(uint8 tierIndex, RiskTierParams params);
    event TokenSupported(address indexed token, bool supported);

    // ERRORS - Gas efficient

    error InvalidAddress();
    error NotNFTOwner();
    error LoanAlreadyRequested();
    error LoanNotAvailable();
    error CannotFundOwnLoan();
    error LoanNotFunded();
    error OnlyBorrowerCanRepay();
    error LoanNotActive();
    error LoanNotDue();
    error NoRiskTierFound();
    error TokenNotSupported();

    // CONSTRUCTOR

    constructor(
        address _nftAddress,
        address _lenderReceiptNftAddress,
        address _initialOwner,
        address[] memory _initialTokens
    )
        Ownable(_initialOwner)
    {
        if (_nftAddress == address(0) || _lenderReceiptNftAddress == address(0)) revert InvalidAddress();

        rentalNft = VerifiableRentalAgreementNFTV2(_nftAddress);
        lenderReceiptNft = TokenReciboRoomlenV2(_lenderReceiptNftAddress);

        // Tokens iniciales (USDT, USDC de Base Sepolia)
        for (uint i = 0; i < _initialTokens.length; i++) {
            supportedTokens[_initialTokens[i]] = true;
            tokenList.push(_initialTokens[i]);
            emit TokenSupported(_initialTokens[i], true);
        }
    }

    // ADMIN FUNCTIONS

    /**
     * @notice Define un nuevo tier de riesgo para el protocolo
     * @dev Solo el owner. Optimizado para Base L2
     */
    function setRiskTier(
        uint8 scoreThreshold,
        uint16 haircutBps,
        uint16 ocBps,
        uint16 interestRateBps
    ) external onlyOwner {
        riskTiers.push(RiskTierParams({
            scoreThreshold: scoreThreshold,
            haircutBps: haircutBps,
            ocBps: ocBps,
            interestRateBps: interestRateBps
        }));
        emit RiskTierSet(uint8(riskTiers.length - 1), riskTiers[riskTiers.length - 1]);
    }

    /**
     * @notice Añade o remueve soporte para un token específico
     * @dev Permite agregar nuevas stablecoins dinámicamente
     */
    function setSupportedToken(address _token, bool _supported) external onlyOwner {
        if (_token == address(0)) revert InvalidAddress();

        bool wasSupported = supportedTokens[_token];
        supportedTokens[_token] = _supported;

        if (_supported && !wasSupported) {
            tokenList.push(_token);
        }

        emit TokenSupported(_token, _supported);
    }

    /**
     * @notice Pausa el protocolo en caso de emergencia
     * @dev Circuit breaker para seguridad
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reanuda el protocolo
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // CORE LENDING FUNCTIONS

    /**
     * @notice Solicita un préstamo colateralizando un NFT de contrato de alquiler
     * @dev Optimizado para Smart Wallets en Base
     * @param _nftId El ID del token VRA-NFT que se usará como colateral
     * @param _tokenAddress Dirección del token a solicitar (USDT/USDC)
     */
    function requestLoan(uint256 _nftId, address _tokenAddress) external nonReentrant whenNotPaused {
        if (rentalNft.ownerOf(_nftId) != msg.sender) revert NotNFTOwner();
        if (loanIndexByNftId[_nftId] != 0) revert LoanAlreadyRequested();
        if (!supportedTokens[_tokenAddress]) revert TokenNotSupported();

        VerifiableRentalAgreementNFTV2.AgreementData memory data = rentalNft.getAgreementData(_nftId);
        RiskTierParams memory tier = _getTierForScore(data.tenantScore);

        uint96 maxAdvance = _calculateMaxAdvance(data.rentAmount, data.termMonths, tier);

        uint256 loanId = loans.length;
        loans.push(Loan({
            nftId: _nftId,
            borrower: msg.sender,
            lender: address(0),
            tokenAddress: _tokenAddress,
            amount: maxAdvance,
            fundingDate: 0,
            dueDate: 0,
            termInMonths: data.termMonths,
            status: LoanStatus.Requested
        }));
        loanIndexByNftId[_nftId] = loanId + 1;

        _loansByBorrower[msg.sender].push(loanId);

        emit LoanRequested(loanId, msg.sender, _nftId, _tokenAddress, maxAdvance);

        rentalNft.transferFrom(msg.sender, address(this), _nftId);
    }

    /**
     * @notice Fondea un préstamo que ha sido previamente solicitado
     * @dev Compatible con Smart Wallets (ERC-4337) en Base
     * @param _loanId El ID del préstamo a fondear
     */
    function fundLoan(uint256 _loanId) external nonReentrant whenNotPaused {
        Loan storage loan = loans[_loanId];
        if (loan.status != LoanStatus.Requested) revert LoanNotAvailable();
        if (loan.borrower == msg.sender) revert CannotFundOwnLoan();

        loan.lender = msg.sender;
        loan.status = LoanStatus.Funded;
        loan.fundingDate = uint64(block.timestamp);
        loan.dueDate = uint64(block.timestamp + (uint256(loan.termInMonths) * 30 days));

        _fundedLoansByLender[msg.sender].push(_loanId);

        RiskTierParams memory tier = _getTierForScore(rentalNft.getAgreementData(loan.nftId).tenantScore);

        emit LoanFunded(_loanId, loan.borrower, msg.sender, loan.tokenAddress, loan.amount, tier.interestRateBps);

        IERC20(loan.tokenAddress).safeTransferFrom(msg.sender, loan.borrower, loan.amount);

        lenderReceiptNft.mint(msg.sender, _loanId);
    }

    /**
     * @notice Repaga un préstamo fondeado
     * @dev Transferencia optimizada en Base L2
     * @param _loanId El ID del préstamo a repagar
     */
    function repayLoan(uint256 _loanId) external nonReentrant whenNotPaused {
        Loan storage loan = loans[_loanId];
        if (loan.status != LoanStatus.Funded) revert LoanNotFunded();
        if (loan.borrower != msg.sender) revert OnlyBorrowerCanRepay();

        RiskTierParams memory tier = _getTierForScore(rentalNft.getAgreementData(loan.nftId).tenantScore);
        uint256 interest = _calculateInterest(loan.amount, tier.interestRateBps, block.timestamp - loan.fundingDate);
        uint256 totalRepayment = loan.amount + interest;

        loan.status = LoanStatus.Repaid;

        address currentLender = lenderReceiptNft.ownerOf(_loanId);

        emit LoanRepaid(_loanId, totalRepayment);

        IERC20(loan.tokenAddress).safeTransferFrom(msg.sender, currentLender, totalRepayment);

        lenderReceiptNft.burn(_loanId);

        rentalNft.transferFrom(address(this), loan.borrower, loan.nftId);
    }

    /**
     * @notice Liquida un préstamo que ha entrado en default (impago)
     * @dev Permite liquidación sin costos prohibitivos en Base L2
     * @param _loanId El ID del préstamo a liquidar
     */
    function liquidateLoan(uint256 _loanId) external nonReentrant whenNotPaused {
        Loan storage loan = loans[_loanId];
        if (loan.status != LoanStatus.Funded) revert LoanNotActive();
        if (block.timestamp <= loan.dueDate) revert LoanNotDue();

        loan.status = LoanStatus.Defaulted;

        address currentLender = lenderReceiptNft.ownerOf(_loanId);

        emit LoanDefaulted(_loanId, currentLender);

        rentalNft.transferFrom(address(this), currentLender, loan.nftId);

        lenderReceiptNft.burn(_loanId);
    }

    // INTERNAL FUNCTIONS

    function _getTierForScore(uint8 _score) internal view returns (RiskTierParams memory) {
        for (uint i = 0; i < riskTiers.length; i++) {
            if (_score >= riskTiers[i].scoreThreshold) {
                return riskTiers[i];
            }
        }
        revert NoRiskTierFound();
    }

    function _calculateMaxAdvance(
        uint96 _rent,
        uint16 _term,
        RiskTierParams memory _tier
    ) internal pure returns (uint96) {
        uint256 totalRent = uint256(_rent) * _term;
        uint256 discountApproximation = (totalRent * _tier.interestRateBps) / (2 * 10000);
        uint256 presentValue = totalRent - discountApproximation;

        uint256 valueAfterHaircut = (presentValue * (10000 - _tier.haircutBps)) / 10000;
        uint256 maxAdvance = (valueAfterHaircut * 10000) / (10000 + _tier.ocBps);

        return uint96(maxAdvance);
    }

    function _calculateInterest(uint96 _principal, uint16 _rateBps, uint256 _timeElapsed) internal pure returns (uint256) {
        return (uint256(_principal) * _rateBps * _timeElapsed) / (10000 * 365 days);
    }

    // VIEW FUNCTIONS - Optimizados para queries

    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }

    function getLoansCount() external view returns (uint256) {
        return loans.length;
    }

    function getRiskTiers() external view returns (RiskTierParams[] memory) {
        return riskTiers;
    }

    function getLoanIdsByBorrower(address _borrower) external view returns (uint256[] memory) {
        return _loansByBorrower[_borrower];
    }

    function getLoanIdsByLender(address _lender) external view returns (uint256[] memory) {
        return _fundedLoansByLender[_lender];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    /**
     * @notice Obtiene una vista consolidada de los datos de un préstamo
     * @dev Optimizado para frontend y metadatos de NFT
     */
    function getLoanUIData(uint256 _loanId) external view returns (
        Loan memory,
        RiskTierParams memory,
        VerifiableRentalAgreementNFTV2.AgreementData memory
    ) {
        Loan memory loan = loans[_loanId];
        VerifiableRentalAgreementNFTV2.AgreementData memory agreementData = rentalNft.getAgreementData(loan.nftId);
        RiskTierParams memory tier = _getTierForScore(agreementData.tenantScore);
        return (loan, tier, agreementData);
    }
}
