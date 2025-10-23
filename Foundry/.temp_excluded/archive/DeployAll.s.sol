// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VerifiableRentalAgreementNFT} from "../src/VerifiableRentalAgreementNFT.sol";
import {TokenReciboRoomlen} from "../src/TokenReciboRoomlen.sol";
import {LendingProtocol} from "../src/LendingProtocol.sol";
import {wMXNB} from "../src/wMXNB.sol";

/**
 * @title Script de Despliegue Completo para RoomLen
 * @notice Despliega TODOS los contratos del protocolo RoomLen (incluyendo wMXNB)
 * @dev Para Moonbase Alpha testnet (Polkadot/Moonbeam)
 */
contract DeployAll is Script {

    function run() external returns (
        address wmxnbAddr,
        address vraNftAddr,
        address trrNftAddr,
        address protocolAddr
    ) {
        // Obtener private key del deployer
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("=======================================================");
        console.log("DESPLIEGUE COMPLETO DE ROOMLEN - MOONBASE ALPHA");
        console.log("=======================================================");
        console.log("Deployer address:", deployerAddress);
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("=======================================================");

        // Iniciar broadcast de transacciones
        vm.startBroadcast(deployerPrivateKey);

        // ===== FASE 1: DESPLEGAR WMXNB TOKEN =====
        console.log("\n[1/5] Desplegando wMXNB Token...");
        wMXNB wmxnbToken = new wMXNB(deployerAddress);
        console.log("  wMXNB desplegado en:", address(wmxnbToken));

        // ===== FASE 2: DESPLEGAR VRA NFT (COLLATERAL) =====
        console.log("\n[2/5] Desplegando VerifiableRentalAgreementNFT...");
        VerifiableRentalAgreementNFT rentalNft = new VerifiableRentalAgreementNFT(deployerAddress);
        console.log("  VRA-NFT desplegado en:", address(rentalNft));

        // ===== FASE 3: DESPLEGAR TRR NFT (RECEIPT) =====
        console.log("\n[3/5] Desplegando TokenReciboRoomlen...");
        TokenReciboRoomlen trrNft = new TokenReciboRoomlen(deployerAddress);
        console.log("  TRR-NFT desplegado en:", address(trrNft));

        // ===== FASE 4: DESPLEGAR LENDING PROTOCOL =====
        console.log("\n[4/5] Desplegando LendingProtocol...");
        LendingProtocol lendingProtocol = new LendingProtocol(
            address(rentalNft),
            address(wmxnbToken),
            address(trrNft),
            deployerAddress
        );
        console.log("  LendingProtocol desplegado en:", address(lendingProtocol));

        // ===== FASE 5: CONFIGURACION POST-DESPLIEGUE =====
        console.log("\n[5/5] Configuracion post-despliegue...");

        // 5.1 - Otorgar permisos a LendingProtocol para mint/burn TRR-NFTs
        trrNft.setLendingProtocol(address(lendingProtocol));
        console.log("  - Permisos de TRR-NFT otorgados a LendingProtocol");

        // 5.2 - Configurar Risk Tiers
        // Tier 0: Score >= 80 (Tier A) - Haircut 10%, OC 10%, APR 15%
        lendingProtocol.setRiskTier(80, 1000, 1000, 1500);
        console.log("  - Risk Tier A configurado (Score >= 80)");

        // Tier 1: Score >= 60 (Tier B) - Haircut 15%, OC 12%, APR 20%
        lendingProtocol.setRiskTier(60, 1500, 1200, 2000);
        console.log("  - Risk Tier B configurado (Score >= 60)");

        // Tier 2: Score >= 40 (Tier C) - Haircut 22%, OC 16%, APR 28%
        lendingProtocol.setRiskTier(40, 2200, 1600, 2800);
        console.log("  - Risk Tier C configurado (Score >= 40)");

        // 5.3 - Mint tokens iniciales para testing (opcional)
        uint256 initialMintAmount = 1000000 * 10**18; // 1M tokens
        wmxnbToken.mint(deployerAddress, initialMintAmount);
        console.log("  - Minted", initialMintAmount / 10**18, "wMXNB to deployer");

        // Finalizar broadcast
        vm.stopBroadcast();

        // ===== RESULTADOS FINALES =====
        console.log("\n=======================================================");
        console.log("DESPLIEGUE COMPLETADO EXITOSAMENTE");
        console.log("=======================================================");
        console.log("wMXNB Token:        ", address(wmxnbToken));
        console.log("VRA-NFT (Collateral):", address(rentalNft));
        console.log("TRR-NFT (Receipt):  ", address(trrNft));
        console.log("LendingProtocol:    ", address(lendingProtocol));
        console.log("=======================================================");
        console.log("\nGuarda estas direcciones en:");
        console.log("  src/lib/contractAddresses.ts");
        console.log("\nVerifica contratos en:");
        console.log("  https://moonbase.moonscan.io/");
        console.log("=======================================================");

        // Retornar direcciones
        wmxnbAddr = address(wmxnbToken);
        vraNftAddr = address(rentalNft);
        trrNftAddr = address(trrNft);
        protocolAddr = address(lendingProtocol);
    }
}
