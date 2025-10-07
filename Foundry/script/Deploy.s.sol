// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {wMXNB} from "../src/wMXNB.sol";
import {VerifiableRentalAgreementNFT} from "../src/VerifiableRentalAgreementNFT.sol";
import {TokenReciboRoomlen} from "../src/TokenReciboRoomlen.sol";
import {LendingProtocol} from "../src/LendingProtocol.sol";

/**
 * @title Script de Despliegue para RoomLen
 * @notice Despliega y configura todos los contratos del protocolo RoomLen de manera secuencial y explícita.
 * @dev Lee la llave privada de una variable de entorno para determinar el desplegador y propietario inicial.
 */
contract DeployContracts is Script {

    /**
     * @notice Punto de entrada principal del script que ejecuta todo el proceso de despliegue.
     * @return wmxnbAddr La dirección del token wMXNB desplegado.
     * @return vraNftAddr La dirección del NFT de contratos de alquiler (VRA) desplegado.
     * @return trrNftAddr La dirección del NFT de recibos (TRR) desplegado.
     * @return protocolAddr La dirección del contrato LendingProtocol principal.
     */
    function run() external returns (address wmxnbAddr, address vraNftAddr, address trrNftAddr, address protocolAddr) {
        // Se obtiene la llave privada de la variable de entorno para asegurar que el `msg.sender` sea el correcto.
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        // Inicia la transmisión de transacciones. Todas las llamadas hasta `stopBroadcast` serán enviadas a la red.
        vm.startBroadcast(deployerPrivateKey);

        console.log("Iniciando despliegue con la cuenta:", deployerAddress);
        console.log("-----------------------------------------------------");

        // --- Fase 1: Despliegue de Contratos de Tokens y NFTs ---
        console.log("Fase 1: Desplegando tokens y NFTs...");

        wMXNB wmxnb = new wMXNB(deployerAddress);
        console.log("Contrato wMXNB (Token de pago) desplegado en:", address(wmxnb));

        VerifiableRentalAgreementNFT rentalNft = new VerifiableRentalAgreementNFT(deployerAddress);
        console.log("Contrato VerifiableRentalAgreementNFT (Colateral) desplegado en:", address(rentalNft));

        TokenReciboRoomlen trrNft = new TokenReciboRoomlen(deployerAddress);
        console.log("Contrato TokenReciboRoomlen (Recibo) desplegado en:", address(trrNft));

        console.log("-----------------------------------------------------");

        // --- Fase 2: Despliegue del Contrato Principal del Protocolo ---
        console.log("Fase 2: Desplegando el contrato LendingProtocol...");

        LendingProtocol lendingProtocol = new LendingProtocol(
            address(rentalNft),
            address(wmxnb),
            address(trrNft),
            deployerAddress
        );
        console.log("Contrato LendingProtocol (Principal) desplegado en:", address(lendingProtocol));

        console.log("-----------------------------------------------------");

        // --- Fase 3: Configuración Post-Despliegue ---
        console.log("Fase 3: Realizando configuracion post-despliegue...");

        // Se otorga el permiso al LendingProtocol para que pueda acuñar y quemar los TRR-NFTs.
        trrNft.setLendingProtocol(address(lendingProtocol));
        console.log("Permiso otorgado a LendingProtocol para controlar los TRR-NFTs.");

        // Se configura un Tier de Riesgo inicial como ejemplo (Tier A).
        lendingProtocol.setRiskTier(80, 1000, 1000, 4);
        console.log("Tier de Riesgo inicial ('A') configurado en el protocolo.");

        // Finaliza la transmisión de transacciones.
        vm.stopBroadcast();

        // --- Fase 4: Devolución de Direcciones ---
        wmxnbAddr = address(wmxnb);
        vraNftAddr = address(rentalNft);
        trrNftAddr = address(trrNft);
        protocolAddr = address(lendingProtocol);

        console.log("-----------------------------------------------------");
        console.log("DESPLIEGUE Y CONFIGURACION COMPLETADOS EXITOSAMENTE");
    }
}