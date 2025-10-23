// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LendingProtocolV2.sol";
import "../src/VerifiableRentalAgreementNFTV2.sol";
import "../src/TokenReciboRoomlenV2.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/**
 * @title LendingProtocolV2 Test Suite
 * @notice Comprehensive tests for RoomLen V2 lending protocol on Base
 * @dev Tests all core functionality: loan request, funding, repayment, liquidation
 */

// Mock USDC token for testing (6 decimals like real USDC)
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6; // USDC has 6 decimals
    }
}

// Mock USDT token for testing
contract MockUSDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6; // USDT has 6 decimals
    }
}

contract LendingProtocolV2Test is Test {
    // Contracts
    LendingProtocolV2 public lendingProtocol;
    VerifiableRentalAgreementNFTV2 public rentalNft;
    TokenReciboRoomlenV2 public receiptNft;
    MockUSDC public usdc;
    MockUSDT public usdt;

    // Test accounts
    address public owner = address(1);
    address public borrower = address(2);
    address public lender = address(3);
    address public lender2 = address(4);

    // Constants
    uint256 constant INITIAL_BALANCE = 1000000 * 10**6; // 1M USDC/USDT
    uint256 constant RENT_AMOUNT = 10000 * 10**6; // 10k USDC monthly rent

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock stablecoins
        usdc = new MockUSDC();
        usdt = new MockUSDT();

        // Deploy NFT contracts
        rentalNft = new VerifiableRentalAgreementNFTV2(owner);

        // Deploy lending protocol with initial token support
        address[] memory initialTokens = new address[](2);
        initialTokens[0] = address(usdc);
        initialTokens[1] = address(usdt);

        receiptNft = new TokenReciboRoomlenV2(owner, address(0));

        lendingProtocol = new LendingProtocolV2(
            address(rentalNft),
            address(receiptNft),
            owner,
            initialTokens
        );

        // Update receipt NFT with correct lending protocol address
        receiptNft.setLendingProtocol(address(lendingProtocol));

        // Configure risk tiers (Base Sepolia compatible)
        // Tier A: Score >= 80, Haircut 10%, OC 10%, APR 15%
        lendingProtocol.setRiskTier(80, 1000, 1000, 1500);

        // Tier B: Score >= 60, Haircut 15%, OC 12%, APR 20%
        lendingProtocol.setRiskTier(60, 1500, 1200, 2000);

        // Tier C: Score >= 40, Haircut 22%, OC 16%, APR 28%
        lendingProtocol.setRiskTier(40, 2200, 1600, 2800);

        vm.stopPrank();

        // Fund test accounts with USDC and USDT
        usdc.mint(borrower, INITIAL_BALANCE);
        usdc.mint(lender, INITIAL_BALANCE);
        usdc.mint(lender2, INITIAL_BALANCE);

        usdt.mint(borrower, INITIAL_BALANCE);
        usdt.mint(lender, INITIAL_BALANCE);
    }

    /* ============ RISK TIER TESTS ============ */

    function testSetRiskTier() public {
        vm.prank(owner);
        lendingProtocol.setRiskTier(90, 500, 500, 1000);

        LendingProtocolV2.RiskTierParams[] memory tiers = lendingProtocol.getRiskTiers();
        assertEq(tiers.length, 4, "Should have 4 tiers");
        assertEq(tiers[3].scoreThreshold, 90, "Score threshold should be 90");
        assertEq(tiers[3].haircutBps, 500, "Haircut should be 5%");
        assertEq(tiers[3].ocBps, 500, "OC should be 5%");
        assertEq(tiers[3].interestRateBps, 1000, "APR should be 10%");
    }

    function testOnlyOwnerCanSetRiskTier() public {
        vm.prank(borrower);
        vm.expectRevert();
        lendingProtocol.setRiskTier(90, 500, 500, 1000);
    }

    function testGetRiskTiers() public view {
        LendingProtocolV2.RiskTierParams[] memory tiers = lendingProtocol.getRiskTiers();
        assertEq(tiers.length, 3, "Should have 3 default tiers");

        // Check Tier A
        assertEq(tiers[0].scoreThreshold, 80);
        assertEq(tiers[0].interestRateBps, 1500); // 15%

        // Check Tier B
        assertEq(tiers[1].scoreThreshold, 60);
        assertEq(tiers[1].interestRateBps, 2000); // 20%

        // Check Tier C
        assertEq(tiers[2].scoreThreshold, 40);
        assertEq(tiers[2].interestRateBps, 2800); // 28%
    }

    /* ============ NFT MINTING TESTS ============ */

    function testMintRentalNFT() public {
        vm.prank(owner);
        uint256 tokenId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12, // 12 months
            85, // tenant score
            "Luxury Apartment - Polanco",
            "Mexico City, CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        assertEq(rentalNft.ownerOf(tokenId), borrower, "Borrower should own the NFT");

        VerifiableRentalAgreementNFTV2.AgreementData memory data = rentalNft.getAgreementData(tokenId);
        assertEq(data.rentAmount, RENT_AMOUNT, "Rent amount should match");
        assertEq(data.termMonths, 12, "Term should be 12 months");
        assertEq(data.tenantScore, 85, "Tenant score should be 85");
        assertEq(data.rentCurrency, address(usdc), "Rent currency should be USDC");
    }

    /* ============ LOAN REQUEST TESTS ============ */

    function testRequestLoanWithUSDC() public {
        // Mint NFT first
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        // Borrower requests loan with USDC
        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        // Verify loan was created
        uint256 loansCount = lendingProtocol.getLoansCount();
        assertEq(loansCount, 1, "Should have 1 loan");

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);
        assertEq(loan.nftId, nftId, "Loan should reference correct NFT");
        assertEq(loan.borrower, borrower, "Borrower should match");
        assertEq(loan.tokenAddress, address(usdc), "Token should be USDC");
        assertTrue(uint8(loan.status) == 0, "Status should be Requested (0)");
        assertGt(loan.amount, 0, "Loan amount should be positive");

        // Verify protocol now owns the NFT
        assertEq(rentalNft.ownerOf(nftId), address(lendingProtocol), "Protocol should own NFT");
    }

    function testRequestLoanWithUSDT() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12346,
            RENT_AMOUNT,
            12,
            85,
            "Test Property 2",
            "CDMX",
            address(usdt),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdt));
        vm.stopPrank();

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);
        assertEq(loan.tokenAddress, address(usdt), "Token should be USDT");
    }

    function testCannotRequestLoanWithUnsupportedToken() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        address unsupportedToken = address(0x999);

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        vm.expectRevert(LendingProtocolV2.TokenNotSupported.selector);
        lendingProtocol.requestLoan(nftId, unsupportedToken);
        vm.stopPrank();
    }

    function testCannotRequestLoanIfNotNFTOwner() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        // Attacker tries to request loan with someone else's NFT
        vm.startPrank(lender);
        vm.expectRevert(LendingProtocolV2.NotNFTOwner.selector);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();
    }

    function testCannotRequestLoanTwice() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));

        vm.expectRevert(LendingProtocolV2.LoanAlreadyRequested.selector);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();
    }

    /* ============ LOAN FUNDING TESTS ============ */

    function testFundLoanWithUSDC() public {
        // Setup: Create and request loan
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        LendingProtocolV2.Loan memory loanBefore = lendingProtocol.getLoan(0);
        uint96 loanAmount = loanBefore.amount;

        uint256 borrowerBalanceBefore = usdc.balanceOf(borrower);
        uint256 lenderBalanceBefore = usdc.balanceOf(lender);

        // Lender funds the loan with USDC
        vm.startPrank(lender);
        usdc.approve(address(lendingProtocol), loanAmount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Verify loan was funded
        LendingProtocolV2.Loan memory loanAfter = lendingProtocol.getLoan(0);
        assertTrue(uint8(loanAfter.status) == 1, "Status should be Funded (1)");
        assertEq(loanAfter.lender, lender, "Lender should be set");
        assertGt(loanAfter.fundingDate, 0, "Funding date should be set");
        assertGt(loanAfter.dueDate, 0, "Due date should be set");

        // Verify lender received receipt NFT
        assertEq(receiptNft.ownerOf(0), lender, "Lender should own receipt NFT");

        // Verify token transfers
        assertEq(usdc.balanceOf(borrower), borrowerBalanceBefore + loanAmount, "Borrower should receive loan");
        assertEq(usdc.balanceOf(lender), lenderBalanceBefore - loanAmount, "Lender should transfer loan");
    }

    function testCannotFundOwnLoan() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);
        usdc.approve(address(lendingProtocol), loan.amount);

        vm.expectRevert(LendingProtocolV2.CannotFundOwnLoan.selector);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();
    }

    function testCannotFundAlreadyFundedLoan() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);

        // First lender funds
        vm.startPrank(lender);
        usdc.approve(address(lendingProtocol), loan.amount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Second lender tries to fund
        vm.startPrank(lender2);
        usdc.approve(address(lendingProtocol), loan.amount);
        vm.expectRevert(LendingProtocolV2.LoanNotAvailable.selector);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();
    }

    /* ============ LOAN REPAYMENT TESTS ============ */

    function testRepayLoan() public {
        // Setup: Create, request, and fund loan
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);
        uint96 loanAmount = loan.amount;

        vm.startPrank(lender);
        usdc.approve(address(lendingProtocol), loanAmount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Fast forward time by 1 month
        vm.warp(block.timestamp + 30 days);

        // Borrower repays loan
        uint256 lenderBalanceBefore = usdc.balanceOf(lender);

        vm.startPrank(borrower);
        usdc.approve(address(lendingProtocol), loanAmount * 2); // Approve extra for interest
        lendingProtocol.repayLoan(0);
        vm.stopPrank();

        // Verify loan was repaid
        LendingProtocolV2.Loan memory loanAfter = lendingProtocol.getLoan(0);
        assertTrue(uint8(loanAfter.status) == 2, "Status should be Repaid (2)");

        // Verify lender received payment (principal + interest)
        assertGt(usdc.balanceOf(lender), lenderBalanceBefore, "Lender should receive repayment with interest");

        // Verify borrower got NFT back
        assertEq(rentalNft.ownerOf(nftId), borrower, "Borrower should have NFT back");
    }

    function testOnlyBorrowerCanRepay() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);

        vm.startPrank(lender);
        usdc.approve(address(lendingProtocol), loan.amount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Attacker tries to repay
        vm.startPrank(lender);
        usdc.approve(address(lendingProtocol), loan.amount * 2);
        vm.expectRevert(LendingProtocolV2.OnlyBorrowerCanRepay.selector);
        lendingProtocol.repayLoan(0);
        vm.stopPrank();
    }

    /* ============ LIQUIDATION TESTS ============ */

    function testLiquidateLoan() public {
        // Setup: Create, request, fund loan
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);

        vm.startPrank(lender);
        usdc.approve(address(lendingProtocol), loan.amount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Fast forward past due date (12 months + 1 day)
        vm.warp(block.timestamp + 365 days + 1 days);

        // Anyone can liquidate now
        lendingProtocol.liquidateLoan(0);

        // Verify loan was defaulted
        LendingProtocolV2.Loan memory loanAfter = lendingProtocol.getLoan(0);
        assertTrue(uint8(loanAfter.status) == 3, "Status should be Defaulted (3)");

        // Verify lender received collateral NFT
        assertEq(rentalNft.ownerOf(nftId), lender, "Lender should own the NFT");
    }

    function testCannotLiquidateBeforeDueDate() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        LendingProtocolV2.Loan memory loan = lendingProtocol.getLoan(0);

        vm.startPrank(lender);
        usdc.approve(address(lendingProtocol), loan.amount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Try to liquidate before due date
        vm.expectRevert(LendingProtocolV2.LoanNotDue.selector);
        lendingProtocol.liquidateLoan(0);
    }

    /* ============ PAUSE/UNPAUSE TESTS ============ */

    function testPauseProtocol() public {
        vm.prank(owner);
        lendingProtocol.pause();

        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        vm.expectRevert();
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();
    }

    function testUnpauseProtocol() public {
        vm.prank(owner);
        lendingProtocol.pause();

        vm.prank(owner);
        lendingProtocol.unpause();

        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        assertEq(lendingProtocol.getLoansCount(), 1, "Should create loan after unpause");
    }

    /* ============ VIEW FUNCTION TESTS ============ */

    function testGetLoansByBorrower() public {
        // Create multiple loans
        for (uint i = 0; i < 3; i++) {
            vm.prank(owner);
            uint256 nftId = rentalNft.mint(
                borrower,
                uint32(i + 100),
                RENT_AMOUNT,
                12,
                85,
                "Test Property",
                "CDMX",
                address(usdc),
                uint64(block.timestamp),
                uint64(block.timestamp + 365 days)
            );

            vm.startPrank(borrower);
            rentalNft.approve(address(lendingProtocol), nftId);
            lendingProtocol.requestLoan(nftId, address(usdc));
            vm.stopPrank();
        }

        uint256[] memory loanIds = lendingProtocol.getLoanIdsByBorrower(borrower);
        assertEq(loanIds.length, 3, "Should have 3 loans");
    }

    function testGetSupportedTokens() public view {
        address[] memory tokens = lendingProtocol.getSupportedTokens();
        assertEq(tokens.length, 2, "Should have 2 supported tokens");
        assertEq(tokens[0], address(usdc), "First token should be USDC");
        assertEq(tokens[1], address(usdt), "Second token should be USDT");
    }

    function testGetLoansCount() public {
        assertEq(lendingProtocol.getLoansCount(), 0, "Should start with 0 loans");

        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            RENT_AMOUNT,
            12,
            85,
            "Test Property",
            "CDMX",
            address(usdc),
            uint64(block.timestamp),
            uint64(block.timestamp + 365 days)
        );

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId, address(usdc));
        vm.stopPrank();

        assertEq(lendingProtocol.getLoansCount(), 1, "Should have 1 loan");
    }

    /* ============ MULTI-TOKEN SUPPORT TESTS ============ */

    function testSetSupportedToken() public {
        MockUSDC newToken = new MockUSDC();

        vm.prank(owner);
        lendingProtocol.setSupportedToken(address(newToken), true);

        address[] memory tokens = lendingProtocol.getSupportedTokens();
        assertEq(tokens.length, 3, "Should have 3 supported tokens");
    }

    function testOnlyOwnerCanSetSupportedToken() public {
        MockUSDC newToken = new MockUSDC();

        vm.prank(borrower);
        vm.expectRevert();
        lendingProtocol.setSupportedToken(address(newToken), true);
    }
}
