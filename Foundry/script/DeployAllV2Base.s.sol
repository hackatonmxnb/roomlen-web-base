// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VerifiableRentalAgreementNFTV2} from "../src/VerifiableRentalAgreementNFTV2.sol";
import {TokenReciboRoomlenV2} from "../src/TokenReciboRoomlenV2.sol";
import {LendingProtocolV2} from "../src/LendingProtocolV2.sol";
import {SecondaryMarketV2} from "../src/SecondaryMarketV2.sol";

/**
 * @title Script de Despliegue Completo para RoomLen V2 - Base Network
 * @notice Despliega TODOS los contratos V2 del protocolo RoomLen optimizados para Base
 * @dev Para Base Sepolia (testnet) y Base Mainnet
 *      Utiliza USDC y USDT nativos de Base
 */
contract DeployAllV2Base is Script {

    // ============================================
    // CONFIGURACIÓN DE TOKENS POR RED
    // ============================================

    // Base Sepolia (Chain ID: 84532)
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant BASE_SEPOLIA_USDT = 0xf8b6097E8c1adFa8B2f37c5876Ed07E87Dcf2C3C; // Placeholder - verificar

    // Base Mainnet (Chain ID: 8453)
    address constant BASE_MAINNET_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant BASE_MAINNET_USDT = 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2;

    function run() external returns (
        address vraNftAddr,
        address trrNftAddr,
        address protocolAddr,
        address marketplaceAddr
    ) {
        // Obtener private key del deployer
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("=======================================================");
        console.log("DESPLIEGUE COMPLETO ROOMLEN V2 - BASE NETWORK");
        console.log("=======================================================");
        console.log("Deployer address:", deployerAddress);
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);

        // Determinar la red
        string memory networkName;
        address[] memory supportedTokens = new address[](2);

        if (block.chainid == 84532) {
            networkName = "Base Sepolia (Testnet)";
            supportedTokens[0] = BASE_SEPOLIA_USDC;
            supportedTokens[1] = BASE_SEPOLIA_USDT;
            console.log("Network: Base Sepolia");
            console.log("USDC Address:", BASE_SEPOLIA_USDC);
            console.log("USDT Address:", BASE_SEPOLIA_USDT);
        } else if (block.chainid == 8453) {
            networkName = "Base Mainnet";
            supportedTokens[0] = BASE_MAINNET_USDC;
            supportedTokens[1] = BASE_MAINNET_USDT;
            console.log("Network: Base Mainnet");
            console.log("USDC Address:", BASE_MAINNET_USDC);
            console.log("USDT Address:", BASE_MAINNET_USDT);
        } else {
            revert("Unsupported network. Use Base Sepolia (84532) or Base Mainnet (8453)");
        }

        console.log("=======================================================");

        // Iniciar broadcast de transacciones
        vm.startBroadcast(deployerPrivateKey);

        // ===== FASE 1: DESPLEGAR VRA NFT V2 (COLLATERAL) =====
        console.log("\n[1/5] Desplegando VerifiableRentalAgreementNFT V2...");
        VerifiableRentalAgreementNFTV2 rentalNft = new VerifiableRentalAgreementNFTV2(deployerAddress);
        console.log("  VRA-NFT V2 desplegado en:", address(rentalNft));

        // ===== FASE 2: DESPLEGAR TRR NFT V2 (RECEIPT) - PRIMERO CON PLACEHOLDER =====
        console.log("\n[2/5] Desplegando TokenReciboRoomlen V2...");
        // Desplegamos con address(this) como placeholder temporal
        TokenReciboRoomlenV2 trrNft = new TokenReciboRoomlenV2(
            deployerAddress,
            deployerAddress // Placeholder temporal, se actualizará después
        );
        console.log("  TRR-NFT V2 desplegado en:", address(trrNft));

        // ===== FASE 3: DESPLEGAR LENDING PROTOCOL V2 =====
        console.log("\n[3/5] Desplegando LendingProtocol V2...");
        // Ahora podemos pasar la dirección real del TRR-NFT
        LendingProtocolV2 lendingProtocol = new LendingProtocolV2(
            address(rentalNft),
            address(trrNft),
            deployerAddress,
            supportedTokens
        );
        console.log("  LendingProtocol V2 desplegado en:", address(lendingProtocol));

        // ===== FASE 4: DESPLEGAR SECONDARY MARKET V2 =====
        console.log("\n[4/5] Desplegando SecondaryMarket V2...");
        // Usar USDC como token principal del marketplace (Base Sepolia o Mainnet según red)
        address wmxnbToken = supportedTokens[0]; // USDC
        SecondaryMarketV2 marketplace = new SecondaryMarketV2(
            address(trrNft),
            wmxnbToken,
            address(lendingProtocol),
            deployerAddress
        );
        console.log("  SecondaryMarket V2 desplegado en:", address(marketplace));

        // ===== FASE 5: CONFIGURACION POST-DESPLIEGUE =====
        console.log("\n[5/5] Configuracion post-despliegue...");

        // 5.1 - Actualizar la referencia de LendingProtocol en TRR-NFT
        trrNft.setLendingProtocol(address(lendingProtocol));
        console.log("  - LendingProtocol configurado en TRR-NFT");

        // 4.2 - Configurar Risk Tiers (optimizados para Base)
        // Tier 0: Score >= 80 (Tier A) - Haircut 10%, OC 10%, APR 12%
        lendingProtocol.setRiskTier(80, 1000, 1000, 1200);
        console.log("  - Risk Tier A configurado (Score >= 80, APR 12%)");

        // Tier 1: Score >= 60 (Tier B) - Haircut 15%, OC 12%, APR 18%
        lendingProtocol.setRiskTier(60, 1500, 1200, 1800);
        console.log("  - Risk Tier B configurado (Score >= 60, APR 18%)");

        // Tier 2: Score >= 40 (Tier C) - Haircut 22%, OC 16%, APR 25%
        lendingProtocol.setRiskTier(40, 2200, 1600, 2500);
        console.log("  - Risk Tier C configurado (Score >= 40, APR 25%)");

        console.log("  - Tokens soportados: USDC, USDT");

        // Finalizar broadcast
        vm.stopBroadcast();

        // ===== RESULTADOS FINALES =====
        console.log("\n=======================================================");
        console.log("DESPLIEGUE V2 COMPLETADO EXITOSAMENTE EN BASE");
        console.log("=======================================================");
        console.log("Network:              ", networkName);
        console.log("VRA-NFT V2:           ", address(rentalNft));
        console.log("TRR-NFT V2:           ", address(trrNft));
        console.log("LendingProtocol V2:   ", address(lendingProtocol));
        console.log("SecondaryMarket V2:   ", address(marketplace));
        console.log("=======================================================");
        console.log("\nTokens Soportados:");
        console.log("  USDC: ", supportedTokens[0]);
        console.log("  USDT: ", supportedTokens[1]);
        console.log("=======================================================");
        console.log("\nPROXIMOS PASOS:");
        console.log("1. Guarda estas direcciones en: src/lib/contractAddresses.ts");
        console.log("2. Verifica contratos en:");
        if (block.chainid == 84532) {
            console.log("   https://sepolia.basescan.org/");
        } else {
            console.log("   https://basescan.org/");
        }
        console.log("3. Configura tu frontend para usar estas direcciones");
        console.log("4. Prueba el protocolo con USDC/USDT de Base");
        console.log("=======================================================");
        console.log("\nFEATURES V2 EN BASE:");
        console.log("- Soporte multi-stablecoin (USDC, USDT)");
        console.log("- Optimizado para costos de gas en Base L2");
        console.log("- Compatible con Smart Wallets (ERC-4337)");
        console.log("- Pausabilidad para emergencias");
        console.log("- Metadatos NFT dinamicos on-chain");
        console.log("- Eventos optimizados para indexacion");
        console.log("- Mercado secundario con batch operations");
        console.log("=======================================================");

        // Retornar direcciones
        vraNftAddr = address(rentalNft);
        trrNftAddr = address(trrNft);
        protocolAddr = address(lendingProtocol);
        marketplaceAddr = address(marketplace);
    }
}
