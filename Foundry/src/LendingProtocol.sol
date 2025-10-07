// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {VerifiableRentalAgreementNFT} from "./VerifiableRentalAgreementNFT.sol";
import {LenderReceiptNFT} from "./LenderReceiptNFT.sol";

/**
 * @title LendingProtocol
 * @author RoomLen Team
 * @notice Contrato principal que gestiona el mercado P2P de préstamos respaldados por NFTs de alquiler.
 * @dev Orquesta el ciclo de vida de los préstamos, desde la solicitud hasta el repago,
 *      e implementa una lógica de valoración de riesgo on-chain basada en tiers.
 */
contract LendingProtocol is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    VerifiableRentalAgreementNFT public immutable rentalNft;
    IERC20 public immutable wmxnbToken;
    LenderReceiptNFT public lenderReceiptNft;

    enum LoanStatus { Requested, Funded, Repaid, Defaulted }

    struct Loan {
        uint256 nftId;
        address borrower;
        address lender;
        uint96 amount;
        uint64 fundingDate;
        uint64 dueDate;
        uint16 termInMonths;
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

    // Mappings for query optimization
    mapping(address => uint256[]) private _loansByBorrower;
    mapping(address => uint256[]) private _fundedLoansByLender;

    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 indexed nftId, uint96 maxAdvance);
    event LoanFunded(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed lender,
        uint96 amount,
        uint16 interestRateBps
    );
    event LoanRepaid(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId, address indexed lender);
    event RiskTierSet(uint8 tierIndex, RiskTierParams params);

    constructor(address _nftAddress, address _wmxnbAddress, address _lenderReceiptNftAddress, address _initialOwner)
        Ownable(_initialOwner)
    {
        require(_nftAddress != address(0) && _wmxnbAddress != address(0) && _lenderReceiptNftAddress != address(0), "LP: Zero address");
        rentalNft = VerifiableRentalAgreementNFT(_nftAddress);
        wmxnbToken = IERC20(_wmxnbAddress);
        lenderReceiptNft = LenderReceiptNFT(_lenderReceiptNftAddress);
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
            nftId: _nftId,
            borrower: msg.sender,
            lender: address(0),
            amount: maxAdvance,
            fundingDate: 0,
            dueDate: 0,
            termInMonths: data.termMonths,
            status: LoanStatus.Requested
        }));
        loanIndexByNftId[_nftId] = loanId + 1; // Lock the NFT to this loan

        _loansByBorrower[msg.sender].push(loanId);

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
        loan.dueDate = uint64(block.timestamp + (uint256(loan.termInMonths) * 30 days));

        _fundedLoansByLender[msg.sender].push(_loanId);

        RiskTierParams memory tier = _getTierForScore(rentalNft.getAgreementData(loan.nftId).tenantScore);

        emit LoanFunded(_loanId, loan.borrower, msg.sender, loan.amount, tier.interestRateBps);

        wmxnbToken.safeTransferFrom(msg.sender, loan.borrower, loan.amount);

        lenderReceiptNft.mint(msg.sender, _loanId);
    }

    function repayLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "LP: Loan not funded or already repaid");
        require(loan.borrower == msg.sender, "LP: Only borrower can repay");

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

    function liquidateLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "LP: Loan not active");
        require(block.timestamp > loan.dueDate, "LP: Loan not yet due for liquidation");

        loan.status = LoanStatus.Defaulted;

        address currentLender = lenderReceiptNft.ownerOf(_loanId);

        emit LoanDefaulted(_loanId, currentLender);

        // Transfer collateral to the lender
        rentalNft.transferFrom(address(this), currentLender, loan.nftId);

        // Burn the lender's receipt
        lenderReceiptNft.burn(_loanId);
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

    function getLoanIdsByBorrower(address _borrower) external view returns (uint256[] memory) {
        return _loansByBorrower[_borrower];
    }

    function getLoanIdsByLender(address _lender) external view returns (uint256[] memory) {
        return _fundedLoansByLender[_lender];
    }
}
