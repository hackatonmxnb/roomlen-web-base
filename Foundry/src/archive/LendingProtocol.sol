// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {VerifiableRentalAgreementNFT} from "./VerifiableRentalAgreementNFT.sol";
import {TokenReciboRoomlen} from "./TokenReciboRoomlen.sol";

/**
 * @title Protocolo de Préstamos RoomLen
 * @author Equipo RoomLen
 * @notice Contrato principal que gestiona un mercado P2P de préstamos colateralizados por NFTs de contratos de alquiler.
 * @dev Orquesta el ciclo de vida completo de un préstamo (solicitud, fondeo, repago y liquidación).
 *      Implementa una lógica de valoración de riesgo on-chain para determinar las condiciones del préstamo.
 */
contract LendingProtocol is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    VerifiableRentalAgreementNFT public immutable rentalNft;
    IERC20 public immutable wmxnbToken;
    TokenReciboRoomlen public lenderReceiptNft;

    enum LoanStatus { Requested, Funded, Repaid, Defaulted }

    struct Loan {
        uint256 nftId;          // ID del NFT colateralizado.
        address borrower;       // Dirección del prestatario original.
        address lender;         // Dirección del prestamista original.
        uint96 amount;          // Monto del préstamo en la menor unidad del token.
        uint64 fundingDate;     // Timestamp de cuando el préstamo fue fondeado.
        uint64 dueDate;         // Timestamp de la fecha de vencimiento para el repago.
        uint16 termInMonths;    // Plazo del préstamo en meses.
        LoanStatus status;      // Estado actual del préstamo.
    }

    struct RiskTierParams {
        uint8 scoreThreshold;       // Puntuación de crédito mínima para calificar a este tier.
        uint16 haircutBps;          // Porcentaje de recorte de valor (en basis points).
        uint16 ocBps;               // Porcentaje de sobrecolateralización (en basis points).
        uint16 interestRateBps;     // Tasa de interés anual (en basis points).
    }

    Loan[] public loans;
    mapping(uint256 => uint256) public loanIndexByNftId;
    RiskTierParams[] public riskTiers;

    mapping(address => uint256[]) private _loansByBorrower;
    mapping(address => uint256[]) private _fundedLoansByLender;

    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 indexed nftId, uint96 maxAdvance);
    event LoanFunded(uint256 indexed loanId, address indexed borrower, address indexed lender, uint96 amount, uint16 interestRateBps);
    event LoanRepaid(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId, address indexed lender);
    event RiskTierSet(uint8 tierIndex, RiskTierParams params);

    constructor(address _nftAddress, address _wmxnbAddress, address _lenderReceiptNftAddress, address _initialOwner)
        Ownable(_initialOwner)
    {
        require(_nftAddress != address(0) && _wmxnbAddress != address(0) && _lenderReceiptNftAddress != address(0), "LP: Direcciones invalidas");
        rentalNft = VerifiableRentalAgreementNFT(_nftAddress);
        wmxnbToken = IERC20(_wmxnbAddress);
        lenderReceiptNft = TokenReciboRoomlen(_lenderReceiptNftAddress);
    }

    /**
     * @notice Define un nuevo tier de riesgo para el protocolo.
     * @dev Solo el owner puede llamar a esta función. Los tiers se usan para calcular el riesgo y las condiciones de nuevos préstamos.
     * @param scoreThreshold Puntuación de crédito mínima para este tier.
     * @param haircutBps Porcentaje de recorte de valor en BPS (ej: 1000 para 10%).
     * @param ocBps Porcentaje de sobrecolateralización en BPS (ej: 1000 para 10%).
     * @param interestRateBps Tasa de interés anual en BPS (ej: 1500 para 15%).
     */
    function setRiskTier(uint8 scoreThreshold, uint16 haircutBps, uint16 ocBps, uint16 interestRateBps) external onlyOwner {
        riskTiers.push(RiskTierParams({
            scoreThreshold: scoreThreshold,
            haircutBps: haircutBps,
            ocBps: ocBps,
            interestRateBps: interestRateBps
        }));
        emit RiskTierSet(uint8(riskTiers.length - 1), riskTiers[riskTiers.length - 1]);
    }

    /**
     * @notice Solicita un préstamo colateralizando un NFT de contrato de alquiler.
     * @dev El prestatario debe ser el dueño del NFT. El contrato tomará custodia del NFT.
     * @param _nftId El ID del token VRA-NFT que se usará como colateral.
     */
    function requestLoan(uint256 _nftId) external nonReentrant {
        require(rentalNft.ownerOf(_nftId) == msg.sender, "LP: No es el propietario del NFT");
        require(loanIndexByNftId[_nftId] == 0, "LP: Prestamo ya solicitado para este NFT");

        VerifiableRentalAgreementNFT.AgreementData memory data = rentalNft.getAgreementData(_nftId);
        RiskTierParams memory tier = _getTierForScore(data.tenantScore);

        uint96 maxAdvance = _calculateMaxAdvance(data.rentAmount, data.termMonths, tier);

        uint256 loanId = loans.length;
        loans.push(Loan({
            nftId: _nftId,
            borrower: msg.sender,
            lender: address(0),
            amount: maxAdvance,
            fundingDate: 0,
            dueDate: 0,
            termInMonths: data.termMonths,
            status: LoanStatus.Requested
        }));
        loanIndexByNftId[_nftId] = loanId + 1; // Previene el re-uso del mismo NFT para otro préstamo.

        _loansByBorrower[msg.sender].push(loanId);

        emit LoanRequested(loanId, msg.sender, _nftId, maxAdvance);

        rentalNft.transferFrom(msg.sender, address(this), _nftId);
    }

    /**
     * @notice Fondea un préstamo que ha sido previamente solicitado.
     * @dev Transfiere el monto del préstamo al prestatario y acuña un LRN-NFT para el prestamista.
     * @param _loanId El ID del préstamo a fondear.
     */
    function fundLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Requested, "LP: Prestamo no disponible para fondeo");
        require(loan.borrower != msg.sender, "LP: No puede fondear su propio prestamo");

        loan.lender = msg.sender;
        loan.status = LoanStatus.Funded;
        loan.fundingDate = uint64(block.timestamp);
        loan.dueDate = uint64(block.timestamp + (uint256(loan.termInMonths) * 30 days));

        _fundedLoansByLender[msg.sender].push(_loanId);

        RiskTierParams memory tier = _getTierForScore(rentalNft.getAgreementData(loan.nftId).tenantScore);

        emit LoanFunded(_loanId, loan.borrower, msg.sender, loan.amount, tier.interestRateBps);

        wmxnbToken.safeTransferFrom(msg.sender, loan.borrower, loan.amount);

        lenderReceiptNft.mint(msg.sender, _loanId);
    }

    /**
     * @notice Repaga un préstamo fondeado.
     * @dev El prestatario transfiere el monto principal más intereses al prestamista actual (dueño del LRN-NFT).
     *      Al completarse, el prestatario recupera su NFT colateral.
     * @param _loanId El ID del préstamo a repagar.
     */
    function repayLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "LP: Prestamo no fondeado o ya pagado");
        require(loan.borrower == msg.sender, "LP: Solo el prestatario puede repagar");

        RiskTierParams memory tier = _getTierForScore(rentalNft.getAgreementData(loan.nftId).tenantScore);
        uint256 interest = _calculateInterest(loan.amount, tier.interestRateBps, block.timestamp - loan.fundingDate);
        uint256 totalRepayment = loan.amount + interest;

        loan.status = LoanStatus.Repaid;

        address currentLender = lenderReceiptNft.ownerOf(_loanId);

        emit LoanRepaid(_loanId);

        wmxnbToken.safeTransferFrom(msg.sender, currentLender, totalRepayment);
        
        lenderReceiptNft.burn(_loanId);

        rentalNft.transferFrom(address(this), loan.borrower, loan.nftId);
    }

    /**
     * @notice Liquida un préstamo que ha entrado en default (impago).
     * @dev Permite a cualquier dirección liquidar un préstamo si la fecha actual ha superado la fecha de vencimiento.
     *      El colateral (VRA-NFT) se transfiere al prestamista actual.
     * @param _loanId El ID del préstamo a liquidar.
     */
    function liquidateLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "LP: El prestamo no esta activo");
        require(block.timestamp > loan.dueDate, "LP: El prestamo aun no ha vencido");

        loan.status = LoanStatus.Defaulted;

        address currentLender = lenderReceiptNft.ownerOf(_loanId);

        emit LoanDefaulted(_loanId, currentLender);

        rentalNft.transferFrom(address(this), currentLender, loan.nftId);

        lenderReceiptNft.burn(_loanId);
    }

    function _getTierForScore(uint8 _score) internal view returns (RiskTierParams memory) {
        for (uint i = 0; i < riskTiers.length; i++) {
            if (_score >= riskTiers[i].scoreThreshold) {
                return riskTiers[i];
            }
        }
        revert("LP: No existe un tier de riesgo para esta puntuacion");
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

    /**
     * @notice Obtiene una vista consolidada de los datos de un préstamo para la UI o metadatos de NFT.
     * @param _loanId El ID del préstamo a consultar.
     * @return LoanUIData Una estructura con los datos más relevantes del préstamo.
     */
    function getLoanUIData(uint256 _loanId) external view returns (Loan memory, RiskTierParams memory, VerifiableRentalAgreementNFT.AgreementData memory) {
        Loan memory loan = loans[_loanId];
        VerifiableRentalAgreementNFT.AgreementData memory agreementData = rentalNft.getAgreementData(loan.nftId);
        RiskTierParams memory tier = _getTierForScore(agreementData.tenantScore);
        return (loan, tier, agreementData);
    }
}
