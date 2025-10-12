// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LendingProtocol.sol";
import "../src/VerifiableRentalAgreementNFT.sol";
import "../src/TokenReciboRoomlen.sol";
import "../src/wMXNB.sol";

contract LendingProtocolTest is Test {
    LendingProtocol public lendingProtocol;
    VerifiableRentalAgreementNFT public rentalNft;
    TokenReciboRoomlen public receiptNft;
    wMXNB public token;

    address public owner = address(1);
    address public borrower = address(2);
    address public lender = address(3);

    uint256 constant INITIAL_BALANCE = 1000000 * 10**18; // 1M tokens

    function setUp() public {
        // Deploy contracts
        vm.startPrank(owner);

        token = new wMXNB(owner);
        rentalNft = new VerifiableRentalAgreementNFT(owner);
        receiptNft = new TokenReciboRoomlen(owner);

        lendingProtocol = new LendingProtocol(
            address(rentalNft),
            address(token),
            address(receiptNft),
            owner
        );

        // Set lending protocol as authorized minter for receipt NFT
        receiptNft.setLendingProtocol(address(lendingProtocol));

        // Configure risk tiers
        // Tier 0: Score >= 80, Haircut 10%, OC 10%, APR 15%
        lendingProtocol.setRiskTier(80, 1000, 1000, 1500);

        // Tier 1: Score >= 60, Haircut 15%, OC 12%, APR 20%
        lendingProtocol.setRiskTier(60, 1500, 1200, 2000);

        // Tier 2: Score >= 40, Haircut 22%, OC 16%, APR 28%
        lendingProtocol.setRiskTier(40, 2200, 1600, 2800);

        vm.stopPrank();

        // Fund borrower and lender with tokens
        vm.prank(owner);
        token.mint(borrower, INITIAL_BALANCE);

        vm.prank(owner);
        token.mint(lender, INITIAL_BALANCE);
    }

    function testSetRiskTier() public {
        vm.prank(owner);
        lendingProtocol.setRiskTier(90, 500, 500, 1000);

        LendingProtocol.RiskTierParams[] memory tiers = lendingProtocol.getRiskTiers();
        assertEq(tiers.length, 4, "Should have 4 tiers");
        assertEq(tiers[3].scoreThreshold, 90, "Score threshold should be 90");
    }

    function testMintNFT() public {
        vm.prank(owner);
        uint256 tokenId = rentalNft.mint(
            borrower,
            12345,
            10000 * 10**18, // 10k rent
            12, // 12 months
            85, // tenant score
            "Test Property",
            "CDMX"
        );

        assertEq(rentalNft.ownerOf(tokenId), borrower, "Borrower should own the NFT");

        VerifiableRentalAgreementNFT.AgreementData memory data = rentalNft.getAgreementData(tokenId);
        assertEq(data.rentAmount, 10000 * 10**18, "Rent amount should match");
        assertEq(data.termMonths, 12, "Term should be 12 months");
        assertEq(data.tenantScore, 85, "Tenant score should be 85");
    }

    function testRequestLoan() public {
        // Mint NFT first
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(
            borrower,
            12345,
            10000 * 10**18,
            12,
            85,
            "Test Property",
            "CDMX"
        );

        // Borrower requests loan
        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId);
        vm.stopPrank();

        // Verify loan was created
        uint256 loansCount = lendingProtocol.getLoansCount();
        assertEq(loansCount, 1, "Should have 1 loan");

        LendingProtocol.Loan memory loan = lendingProtocol.getLoan(0);
        assertEq(loan.nftId, nftId, "Loan should reference correct NFT");
        assertEq(loan.borrower, borrower, "Borrower should match");
        assertTrue(uint8(loan.status) == 0, "Status should be Requested (0)");
        assertGt(loan.amount, 0, "Loan amount should be positive");

        // Verify protocol now owns the NFT
        assertEq(rentalNft.ownerOf(nftId), address(lendingProtocol), "Protocol should own NFT");
    }

    function testFundLoan() public {
        // Setup: Create and request loan
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(borrower, 12345, 10000 * 10**18, 12, 85, "Test Property", "CDMX");

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId);
        vm.stopPrank();

        LendingProtocol.Loan memory loanBefore = lendingProtocol.getLoan(0);
        uint96 loanAmount = loanBefore.amount;

        // Lender funds the loan
        vm.startPrank(lender);
        token.approve(address(lendingProtocol), loanAmount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Verify loan was funded
        LendingProtocol.Loan memory loanAfter = lendingProtocol.getLoan(0);
        assertTrue(uint8(loanAfter.status) == 1, "Status should be Funded (1)");
        assertEq(loanAfter.lender, lender, "Lender should be set");
        assertGt(loanAfter.fundingDate, 0, "Funding date should be set");
        assertGt(loanAfter.dueDate, 0, "Due date should be set");

        // Verify lender received receipt NFT
        assertEq(receiptNft.ownerOf(0), lender, "Lender should own receipt NFT");

        // Verify borrower received tokens
        assertEq(token.balanceOf(borrower), INITIAL_BALANCE + loanAmount, "Borrower should receive loan amount");
    }

    function testRepayLoan() public {
        // Setup: Create, request, and fund loan
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(borrower, 12345, 10000 * 10**18, 12, 85, "Test Property", "CDMX");

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId);
        vm.stopPrank();

        LendingProtocol.Loan memory loan = lendingProtocol.getLoan(0);
        uint96 loanAmount = loan.amount;

        vm.startPrank(lender);
        token.approve(address(lendingProtocol), loanAmount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Fast forward time by 1 month
        vm.warp(block.timestamp + 30 days);

        // Borrower repays loan
        uint256 lenderBalanceBefore = token.balanceOf(lender);

        vm.startPrank(borrower);
        // Approve more than loan amount to cover interest
        token.approve(address(lendingProtocol), loanAmount * 2);
        lendingProtocol.repayLoan(0);
        vm.stopPrank();

        // Verify loan was repaid
        LendingProtocol.Loan memory loanAfter = lendingProtocol.getLoan(0);
        assertTrue(uint8(loanAfter.status) == 2, "Status should be Repaid (2)");

        // Verify lender received payment (principal + interest)
        assertGt(token.balanceOf(lender), lenderBalanceBefore, "Lender should receive repayment");

        // Verify borrower got NFT back
        assertEq(rentalNft.ownerOf(nftId), borrower, "Borrower should have NFT back");
    }

    function testCannotRequestLoanWithoutOwnership() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(borrower, 12345, 10000 * 10**18, 12, 85, "Test Property", "CDMX");

        // Attacker tries to request loan with someone else's NFT
        vm.startPrank(lender);
        vm.expectRevert("LP: No es el propietario del NFT");
        lendingProtocol.requestLoan(nftId);
        vm.stopPrank();
    }

    function testCannotFundOwnLoan() public {
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(borrower, 12345, 10000 * 10**18, 12, 85, "Test Property", "CDMX");

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId);

        // Borrower tries to fund their own loan
        LendingProtocol.Loan memory loan = lendingProtocol.getLoan(0);
        token.approve(address(lendingProtocol), loan.amount);

        vm.expectRevert("LP: No puede fondear su propio prestamo");
        lendingProtocol.fundLoan(0);
        vm.stopPrank();
    }

    function testLiquidateLoan() public {
        // Setup: Create, request, fund loan
        vm.prank(owner);
        uint256 nftId = rentalNft.mint(borrower, 12345, 10000 * 10**18, 12, 85, "Test Property", "CDMX");

        vm.startPrank(borrower);
        rentalNft.approve(address(lendingProtocol), nftId);
        lendingProtocol.requestLoan(nftId);
        vm.stopPrank();

        LendingProtocol.Loan memory loan = lendingProtocol.getLoan(0);

        vm.startPrank(lender);
        token.approve(address(lendingProtocol), loan.amount);
        lendingProtocol.fundLoan(0);
        vm.stopPrank();

        // Fast forward past due date (12 months + buffer)
        vm.warp(block.timestamp + 365 days);

        // Anyone can liquidate now
        lendingProtocol.liquidateLoan(0);

        // Verify loan was defaulted
        LendingProtocol.Loan memory loanAfter = lendingProtocol.getLoan(0);
        assertTrue(uint8(loanAfter.status) == 3, "Status should be Defaulted (3)");

        // Verify lender received collateral NFT
        assertEq(rentalNft.ownerOf(nftId), lender, "Lender should own the NFT");
    }

    function testGetLoansByBorrower() public {
        // Create multiple loans
        for (uint i = 0; i < 3; i++) {
            vm.prank(owner);
            uint256 nftId = rentalNft.mint(
                borrower,
                uint32(i),
                10000 * 10**18,
                12,
                85,
                "Test Property",
                "CDMX"
            );

            vm.startPrank(borrower);
            rentalNft.approve(address(lendingProtocol), nftId);
            lendingProtocol.requestLoan(nftId);
            vm.stopPrank();
        }

        uint256[] memory loanIds = lendingProtocol.getLoanIdsByBorrower(borrower);
        assertEq(loanIds.length, 3, "Should have 3 loans");
    }
}
