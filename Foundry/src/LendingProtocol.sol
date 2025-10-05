// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {VerifiableRentalAgreementNFT} from "./VerifiableRentalAgreementNFT.sol";

/**
 * @title LendingProtocol
 * @author RoomLen Team
 * @notice Contrato principal que gestiona el mercado P2P de préstamos respaldados por NFTs de alquiler.
 * @dev Orquesta el ciclo de vida de los préstamos, desde la solicitud hasta el repago,
 *      e implementa una lógica de valoración de riesgo on-chain basada en tiers.
 */
contract LendingProtocol is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- VISION A LARGO PLAZO Y POTENCIAL EN POLKADOT ---
    // RoomLen está diseñado para ser un pilar del ecosistema RWA (Real World Assets) en Polkadot.
    // 1. PARACHAIN ESPECIALIZADA: RoomLen podría evolucionar a su propia Parachain,
    //    optimizada para la gestión de activos inmobiliarios tokenizados.
    // 2. INTEROPERABILIDAD (XCM): El VerifiableRentalAgreementNFT (VRA) es un activo componible.
    //    Gracias a XCM, este NFT podrá ser usado como colateral en otros protocolos DeFi
    //    del ecosistema Polkadot (ej. Acala, Moonbeam) para préstamos, stablecoins, etc.
    // 3. ORACULOS Y PRIVACIDAD: Parachains como Phala Network podrían usarse para gestionar
    //    datos sensibles de los contratos y scores de reputación de forma privada.
    // Este contrato es el primer paso hacia un mercado financiero inmobiliario abierto y descentralizado.

    VerifiableRentalAgreementNFT public immutable rentalNft;
    IERC20 public immutable wmxnbToken;

    enum LoanStatus { Requested, Funded, Repaid, Defaulted }

    struct Loan {
        address borrower;
        address lender;
        uint256 nftId;
        uint96 amount;
        uint16 termInMonths;
        uint64 fundingDate;
        LoanStatus status;
    }

    struct RiskTierParams {
        uint8 scoreThreshold;
        uint16 haircutBps;
        uint16 ocBps;
        uint16 interestRateBps;
    }

    Loan[] public loans;
    mapping(uint256 => uint256) public loanIndexByNftId;
    RiskTierParams[] public riskTiers;

    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 indexed nftId, uint96 maxAdvance);
    event LoanFunded(uint256 indexed loanId, address indexed lender, uint96 amount);
    event LoanRepaid(uint256 indexed loanId);
    event RiskTierSet(uint8 tierIndex, RiskTierParams params);

    constructor(address _nftAddress, address _wmxnbAddress, address _initialOwner)
        Ownable(_initialOwner)
    {
        require(_nftAddress != address(0) && _wmxnbAddress != address(0), "LP: Zero address");
        rentalNft = VerifiableRentalAgreementNFT(_nftAddress);
        wmxnbToken = IERC20(_wmxnbAddress);
    }

    function setRiskTier(uint8 scoreThreshold, uint16 haircutBps, uint16 ocBps, uint16 interestRateBps) external onlyOwner {
        riskTiers.push(RiskTierParams({
            scoreThreshold: scoreThreshold,
            haircutBps: haircutBps,
            ocBps: ocBps,
            interestRateBps: interestRateBps
        }));
        emit RiskTierSet(uint8(riskTiers.length - 1), riskTiers[riskTiers.length - 1]);
    }

    function requestLoan(uint256 _nftId) external nonReentrant {
        require(rentalNft.ownerOf(_nftId) == msg.sender, "LP: Not NFT owner");
        require(loanIndexByNftId[_nftId] == 0, "LP: Loan already requested for this NFT");

        VerifiableRentalAgreementNFT.AgreementData memory data = rentalNft.getAgreementData(_nftId);
        RiskTierParams memory tier = _getTierForScore(data.tenantScore);

        uint96 maxAdvance = _calculateMaxAdvance(data.rentAmount, data.termMonths, tier);

        uint256 loanId = loans.length;
        loans.push(Loan({
            borrower: msg.sender,
            lender: address(0),
            nftId: _nftId,
            amount: maxAdvance,
            termInMonths: data.termMonths,
            fundingDate: 0,
            status: LoanStatus.Requested
        }));
        loanIndexByNftId[_nftId] = loanId + 1;

        emit LoanRequested(loanId, msg.sender, _nftId, maxAdvance);

        rentalNft.transferFrom(msg.sender, address(this), _nftId);
    }

    function fundLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Requested, "LP: Loan not available for funding");
        require(loan.borrower != msg.sender, "LP: Cannot fund own loan");

        loan.lender = msg.sender;
        loan.status = LoanStatus.Funded;
        loan.fundingDate = uint64(block.timestamp);

        emit LoanFunded(_loanId, msg.sender, loan.amount);

        wmxnbToken.safeTransferFrom(msg.sender, loan.borrower, loan.amount);
    }

    function repayLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "LP: Loan not funded or already repaid");
        require(loan.borrower == msg.sender, "LP: Only borrower can repay");

        RiskTierParams memory tier = _getTierForScore(rentalNft.getAgreementData(loan.nftId).tenantScore);
        uint256 interest = _calculateInterest(loan.amount, tier.interestRateBps, block.timestamp - loan.fundingDate);
        uint256 totalRepayment = loan.amount + interest;

        loan.status = LoanStatus.Repaid;

        emit LoanRepaid(_loanId);

        wmxnbToken.safeTransferFrom(msg.sender, loan.lender, totalRepayment);
        rentalNft.transferFrom(address(this), loan.borrower, loan.nftId);
    }

    function _getTierForScore(uint8 _score) internal view returns (RiskTierParams memory) {
        for (uint i = 0; i < riskTiers.length; i++) {
            if (_score >= riskTiers[i].scoreThreshold) {
                return riskTiers[i];
            }
        }
        revert("LP: No suitable risk tier for this score");
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

    /**
     * @notice Devuelve los IDs de los préstamos solicitados por un borrower.
     * @dev Itera sobre todos los préstamos. Para una escala muy grande, se usaría un indexador off-chain.
     */
    function getLoanIdsByBorrower(address _borrower) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].borrower == _borrower) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].borrower == _borrower) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }

    /**
     * @notice Devuelve los IDs de los préstamos financiados por un lender.
     * @dev Itera sobre todos los préstamos. Para una escala muy grande, se usaría un indexador off-chain.
     */
    function getLoanIdsByLender(address _lender) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].lender == _lender) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].lender == _lender) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }
}
