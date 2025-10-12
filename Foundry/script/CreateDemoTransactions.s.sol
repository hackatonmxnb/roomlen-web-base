// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {RiskTier} from "./LendingProtocol.sol";
import {VerifiableRentalAgreementNFT} from "../src/VerifiableRentalAgreementNFT.sol";
import {TokenReciboRoomlen} from "../src/TokenReciboRoomlen.sol";
import {LendingProtocol} from "../src/LendingProtocol.sol";
import {wMXNB} from "../src/wMXNB.sol";

/**
 * @title Script de Transacciones Demo para RoomLen
 * @notice Crea transacciones de prueba para el hackathon:
 *         - 3 NFTs minteados (propiedades demo)
 *         - 2 Loans solicitados
 *         - 1 Loan fondeado
 * @dev Para Moonbase Alpha testnet
 */
contract CreateDemoTransactions is Script {

    // TODO: Update these addresses after deploying to Paseo Testnet
    address constant WMXNB_ADDRESS = address(0); // Update after deployment
    address constant RENTAL_NFT_ADDRESS = address(0); // Update after deployment
    address constant LENDING_PROTOCOL_ADDRESS = address(0); // Update after deployment

    // Instancias de contratos
    wMXNB wmxnbToken;
    VerifiableRentalAgreementNFT rentalNft;
    LendingProtocol lendingProtocol;

    function run() external {
        // Obtener private key del usuario
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        // Inicializar contratos
        wmxnbToken = wMXNB(WMXNB_ADDRESS);
        rentalNft = VerifiableRentalAgreementNFT(RENTAL_NFT_ADDRESS);
        lendingProtocol = LendingProtocol(LENDING_PROTOCOL_ADDRESS);

        console.log("=======================================================");
        console.log("CREANDO TRANSACCIONES DEMO - ROOMLEN HACKATHON");
        console.log("=======================================================");
        console.log("Usuario:", deployerAddress);
        console.log("Network: Moonbase Alpha (Chain ID:", block.chainid, ")");
        console.log("=======================================================\n");

        // Iniciar broadcast
        vm.startBroadcast(deployerPrivateKey);

        // ===== FASE 1: MINT 3 NFTs =====
        console.log("[FASE 1] Minting 3 NFTs (Propiedades Demo)\n");

        uint256 nftId1 = mintDemoNFT(
            deployerAddress,
            1001,
            10000 ether, // 10,000 MXN rent
            12,          // 12 months
            85,          // Score 85 (Tier A)
            "Loft Reforma 210",
            "CDMX, Juarez"
        );

        uint256 nftId2 = mintDemoNFT(
            deployerAddress,
            1002,
            8000 ether,  // 8,000 MXN rent
            12,
            72,          // Score 72 (Tier B)
            "Depto Roma Nte 88",
            "CDMX, Roma"
        );

        uint256 nftId3 = mintDemoNFT(
            deployerAddress,
            1003,
            12000 ether, // 12,000 MXN rent
            18,
            92,          // Score 92 (Tier A)
            "Casa Lomas 34",
            "CDMX, Lomas"
        );

        console.log("\n=======================================================");
        console.log("FASE 1 COMPLETADA: 3 NFTs Minteados");
        console.log("=======================================================\n");

        // ===== FASE 2: REQUEST 2 LOANS =====
        console.log("[FASE 2] Solicitando 2 Loans\n");

        uint256 loanId1 = requestDemoLoan(nftId1);
        uint256 loanId2 = requestDemoLoan(nftId2);

        console.log("\n=======================================================");
        console.log("FASE 2 COMPLETADA: 2 Loans Solicitados");
        console.log("=======================================================\n");

        // ===== FASE 3: FUND 1 LOAN =====
        console.log("[FASE 3] Fondeando 1 Loan\n");

        fundDemoLoan(loanId1, deployerAddress);

        console.log("\n=======================================================");
        console.log("FASE 3 COMPLETADA: 1 Loan Fondeado");
        console.log("=======================================================\n");

        // Finalizar broadcast
        vm.stopBroadcast();

        // ===== RESUMEN FINAL =====
        printFinalSummary(nftId1, nftId2, nftId3, loanId1, loanId2);
    }

    function mintDemoNFT(
        address owner,
        uint256 agreementId,
        uint256 rentAmount,
        uint256 termMonths,
        uint256 tenantScore,
        string memory propertyName,
        string memory location
    ) internal returns (uint256) {
        console.log("  Minting NFT:");
        console.log("    Property:", propertyName);
        console.log("    Location:", location);
        console.log("    Rent:", rentAmount / 1 ether, "MXN/month");
        console.log("    Term:", termMonths, "months");
        console.log("    Tenant Score:", tenantScore);

        uint256 nftId = rentalNft.mint(
            owner,
            agreementId,
            rentAmount,
            termMonths,
            tenantScore,
            propertyName,
            location
        );

        console.log("    -> NFT ID:", nftId);
        console.log("    -> View on Moonscan: https://moonbase.moonscan.io/token/", RENTAL_NFT_ADDRESS, "?a=", nftId);
        console.log("");

        return nftId;
    }

    function requestDemoLoan(uint256 nftId) internal returns (uint256) {
        console.log("  Requesting Loan for NFT ID:", nftId);

        uint256 loanId = lendingProtocol.requestLoan(nftId);

        console.log("    -> Loan ID:", loanId);
        console.log("    -> Status: Requested (Waiting for Funding)");
        console.log("");

        return loanId;
    }

    function fundDemoLoan(uint256 loanId, address lender) internal {
        // Obtener datos del loan
        (
            LendingProtocol.Loan memory loan,
            LendingProtocol.RiskTier memory tier,
            VerifiableRentalAgreementNFT.RentalAgreement memory agreement
        ) = lendingProtocol.getLoanUIData(loanId);

        console.log("  Funding Loan ID:", loanId);
        console.log("    Loan Amount:", loan.amount / 1 ether, "MXN");
        console.log("    Risk Tier: Score >=", tier.minScore);
        console.log("    Haircut:", tier.haircutBps / 100, "%");
        console.log("    Over-collateral:", tier.ocBps / 100, "%");

        // Verificar si el lender tiene suficiente wMXNB
        uint256 balance = wmxnbToken.balanceOf(lender);
        console.log("    Lender balance:", balance / 1 ether, "wMXNB");

        if (balance < loan.amount) {
            console.log("    -> Minting", (loan.amount - balance) / 1 ether, "wMXNB to lender...");
            wmxnbToken.mint(lender, loan.amount - balance + 1000 ether);
        }

        // Aprobar tokens
        console.log("    -> Approving wMXNB...");
        wmxnbToken.approve(LENDING_PROTOCOL_ADDRESS, loan.amount);

        // Fondear el loan
        console.log("    -> Funding loan...");
        lendingProtocol.fundLoan(loanId);

        console.log("    -> Loan Funded Successfully!");
        console.log("    -> Lender Receipt NFT minted");
        console.log("");
    }

    function printFinalSummary(
        uint256 nftId1,
        uint256 nftId2,
        uint256 nftId3,
        uint256 loanId1,
        uint256 loanId2
    ) internal view {
        console.log("=======================================================");
        console.log("TRANSACCIONES DEMO COMPLETADAS EXITOSAMENTE");
        console.log("=======================================================");
        console.log("\nNFTs Creados (Propiedades):");
        console.log("  NFT #", nftId1, " - Loft Reforma 210 (Tier A)");
        console.log("  NFT #", nftId2, " - Depto Roma Nte 88 (Tier B)");
        console.log("  NFT #", nftId3, " - Casa Lomas 34 (Tier A)");

        console.log("\nLoans Solicitados:");
        console.log("  Loan #", loanId1, " - NFT #", nftId1, " (FUNDED)");
        console.log("  Loan #", loanId2, " - NFT #", nftId2, " (REQUESTED - Waiting for funding)");

        console.log("\nLoans Fondeados:");
        console.log("  Loan #", loanId1, " - FUNDED (Lender receives rent stream)");

        console.log("\n=======================================================");
        console.log("LINKS UTILES:");
        console.log("=======================================================");
        console.log("Moonscan Explorer:");
        console.log("  https://moonbase.moonscan.io/");
        console.log("\nContratos:");
        console.log("  RentalNFT:       https://moonbase.moonscan.io/address/", RENTAL_NFT_ADDRESS);
        console.log("  LendingProtocol: https://moonbase.moonscan.io/address/", LENDING_PROTOCOL_ADDRESS);
        console.log("  wMXNB Token:     https://moonbase.moonscan.io/address/", WMXNB_ADDRESS);
        console.log("\n=======================================================");
        console.log("GUARDALO PARA TU PITCH:");
        console.log("  - 3 NFTs minteados con propiedades reales");
        console.log("  - 2 Loans solicitados (diferentes risk tiers)");
        console.log("  - 1 Loan fondeado (flujo completo end-to-end)");
        console.log("=======================================================\n");
    }
}
