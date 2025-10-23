// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title Token wMXNB (de prueba)
 * @author Equipo RoomLen
 * @notice Token ERC20 de prueba que simula la moneda del protocolo (wMXNB) para la testnet.
 * @dev La función de acuñación es pública intencionadamente para facilitar la obtención de fondos durante el desarrollo y la hackathon.
 *      En un entorno de producción, esta función debería tener un control de acceso estricto.
 */
contract wMXNB is ERC20, Ownable {

    /**
     * @notice Inicializa el contrato y su propietario.
     * @param initialOwner La dirección que será la propietaria del contrato.
     */
    constructor(address initialOwner) ERC20("Wrapped MXNB", "wMXNB") Ownable(initialOwner) {}

    /**
     * @notice Acuña una cantidad de tokens a una dirección específica.
     * @dev La visibilidad es `public` para facilitar las pruebas. No usar en producción sin añadir control de acceso.
     * @param to La dirección que recibirá los tokens acuñados.
     * @param amount La cantidad de tokens a acuñar (considerando los decimales).
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
