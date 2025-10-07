// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {wMXNB} from "../src/wMXNB.sol";
import {VerifiableRentalAgreementNFT} from "../src/VerifiableRentalAgreementNFT.sol";
import {LenderReceiptNFT} from "../src/LenderReceiptNFT.sol";
import {LendingProtocol} from "../src/LendingProtocol.sol";

contract DeployContracts is Script {
    function run() external returns (address, address, address, address) {
        vm.startBroadcast();

        // 1. Desplegar wMXNB (token de prueba)
        wMXNB wmxnb = new wMXNB(msg.sender);

        // 2. Desplegar VerifiableRentalAgreementNFT (el colateral del arrendador)
        VerifiableRentalAgreementNFT rentalNft = new VerifiableRentalAgreementNFT(msg.sender);

        // 3. Desplegar LenderReceiptNFT (el recibo del inversor)
        LenderReceiptNFT lenderReceiptNft = new LenderReceiptNFT(msg.sender);

        // 4. Desplegar el protocolo principal
        LendingProtocol lendingProtocol = new LendingProtocol(
            address(rentalNft),
            address(wmxnb),
            address(lenderReceiptNft),
            msg.sender
        );

        // 5. Configuración post-despliegue
        // Asignar el permiso al LendingProtocol para que pueda acuñar y quemar recibos
        lenderReceiptNft.setLendingProtocol(address(lendingProtocol));

        // Configurar un Tier de Riesgo inicial (Ejemplo: Tier A)
        // Score >= 80, Haircut 10%, OC 10%, Tasa de interés 15% anual (aprox)
        // La tasa se calcula como 1500 / 365 = 4.1 bps por día. Lo dejamos en 4 bps.
        lendingProtocol.setRiskTier(80, 1000, 1000, 4);

        vm.stopBroadcast();

        // Devolver las direcciones de los contratos desplegados
        return (
            address(wmxnb),
            address(rentalNft),
            address(lenderReceiptNft),
            address(lendingProtocol)
        );
    }
}
