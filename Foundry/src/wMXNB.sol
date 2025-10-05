// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title Wrapped MXNB Token (wMXNB)
 * @author RoomLen Team
 * @notice Token ERC20 de prueba para el protocolo RoomLen en la testnet Paseo.
 * @dev Simula la moneda del protocolo, wMXNB. La función de acuñación es pública
 *      para facilitar la obtención de fondos durante el hackathon.
 */
contract wMXNB is ERC20, Ownable {

    /**
     * @notice Inicializa el contrato, estableciendo el propietario inicial.
     * @param initialOwner La dirección que será la propietaria del contrato.
     */
    constructor(address initialOwner) ERC20("Wrapped MXNB", "wMXNB") Ownable(initialOwner) {}

    /**
     * @notice Acuña una cantidad de tokens a una dirección específica.
     * @dev La visibilidad de esta función es `public` para facilitar las pruebas en el
     *      entorno del hackathon. En un despliegue de producción, esta función
     *      estaría protegida con un control de acceso más estricto.
     * @param to La dirección que recibirá los tokens acuñados.
     * @param amount La cantidad de tokens a acuñar, incluyendo decimales.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
