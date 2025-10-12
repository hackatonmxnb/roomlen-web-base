/**
 * Script de Setup de Datos de Prueba para RoomLen
 *
 * Este script crea:
 * - Tokens wMXNB para testing
 * - 3 NFTs de contratos de alquiler con diferentes credit scores
 *
 * Ejecutar: npx ts-node scripts/setupDemoData.ts
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// Contract Addresses - Deployed on Paseo Testnet
const WMXNB_ADDRESS = '0xF48A62Fd563b3aBfDBA8542a484bb87183ef6342';
const RENTAL_NFT_ADDRESS = '0x9a340Cd35537C05ec78b41064D99d15fb08e2b97';
const LENDING_PROTOCOL_ADDRESS = '0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4';

// ABIs simplificados (solo las funciones que necesitamos)
const WMXNB_ABI = [
  'function mint(address to, uint256 amount) public',
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)'
];

const RENTAL_NFT_ABI = [
  'function mint(address owner, uint32 agreementId, uint96 rentAmount, uint16 termMonths, uint8 tenantScore, string propertyName, string location) public returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getAgreementData(uint256 tokenId) view returns (tuple(string propertyName, string location, uint96 rentAmount, uint16 termMonths, uint8 tenantScore, uint32 agreementId))'
];

const LENDING_PROTOCOL_ABI = [
  'function getRiskTiers() view returns (tuple(uint8 scoreThreshold, uint16 haircutBps, uint16 ocBps, uint16 interestRateBps)[])',
  'function requestLoan(uint256 _nftId) external'
];

// Network Configuration
const RPC_URL = 'https://testnet-passet-hub-eth-rpc.polkadot.io';
const CHAIN_ID = 420420422;

async function main() {
  console.log('🚀 Iniciando setup de datos de prueba para RoomLen...\n');

  // Verificar que existe la private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY no encontrada en .env');
    console.log('💡 Crea un archivo .env con:');
    console.log('PRIVATE_KEY=tu_private_key_aqui');
    process.exit(1);
  }

  // Conectar al provider
  console.log('🔌 Conectando a Paseo Testnet...');
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'Paseo Testnet'
  });

  // Crear wallet
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('👛 Wallet conectada:', wallet.address);

  // Verificar balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'PAS');

  if (balance < ethers.parseEther('0.1')) {
    console.log('⚠️  Advertencia: Balance bajo. Considera obtener más PAS del faucet.');
  }

  console.log('\n---\n');

  // Conectar a los contratos
  const wmxnb = new ethers.Contract(WMXNB_ADDRESS, WMXNB_ABI, wallet);
  const rentalNft = new ethers.Contract(RENTAL_NFT_ADDRESS, RENTAL_NFT_ABI, wallet);
  const lendingProtocol = new ethers.Contract(LENDING_PROTOCOL_ADDRESS, LENDING_PROTOCOL_ABI, wallet);

  // PASO 1: Verificar configuración del protocolo
  console.log('📋 PASO 1: Verificando configuración del protocolo...');
  try {
    const riskTiers = await lendingProtocol.getRiskTiers();
    console.log('✅ Risk Tiers configurados:', riskTiers.length);
    riskTiers.forEach((tier: any, index: number) => {
      console.log(`   Tier ${index + 1}: Score >= ${tier.scoreThreshold}, Interest: ${tier.interestRateBps / 100}%`);
    });
  } catch (error: any) {
    console.error('❌ Error verificando risk tiers:', error.message);
  }

  console.log('\n---\n');

  // PASO 2: Mintear tokens wMXNB
  console.log('💵 PASO 2: Creando tokens wMXNB de prueba...');
  try {
    const mintAmount = ethers.parseEther('20000'); // 20,000 wMXNB
    console.log(`   Minteando ${ethers.formatEther(mintAmount)} wMXNB para ${wallet.address}...`);

    const tx1 = await wmxnb.mint(wallet.address, mintAmount);
    console.log('   📤 Transacción enviada:', tx1.hash);
    await tx1.wait();
    console.log('   ✅ Tokens minteados!');

    const balance = await wmxnb.balanceOf(wallet.address);
    console.log('   💰 Balance actual:', ethers.formatEther(balance), 'wMXNB');
  } catch (error: any) {
    console.error('   ❌ Error minteando tokens:', error.message);
  }

  console.log('\n---\n');

  // PASO 3: Crear NFTs de contratos de alquiler
  console.log('🏠 PASO 3: Creando NFTs de contratos de alquiler...');

  const properties = [
    {
      agreementId: 1001,
      rentAmount: ethers.parseEther('5000'), // 5000 wMXNB/mes
      termMonths: 12,
      tenantScore: 85,
      propertyName: 'Departamento Centro CDMX',
      location: 'Ciudad de Mexico, Mexico'
    },
    {
      agreementId: 1002,
      rentAmount: ethers.parseEther('3500'), // 3500 wMXNB/mes
      termMonths: 6,
      tenantScore: 65,
      propertyName: 'Casa Guadalajara',
      location: 'Guadalajara, Jalisco'
    },
    {
      agreementId: 1003,
      rentAmount: ethers.parseEther('2000'), // 2000 wMXNB/mes
      termMonths: 3,
      tenantScore: 45,
      propertyName: 'Estudio Monterrey',
      location: 'Monterrey, Nuevo Leon'
    }
  ];

  const mintedTokenIds: number[] = [];

  for (const [index, property] of properties.entries()) {
    try {
      console.log(`\n   🏡 NFT ${index + 1}/3: ${property.propertyName}`);
      console.log(`      - Renta: ${ethers.formatEther(property.rentAmount)} wMXNB/mes`);
      console.log(`      - Plazo: ${property.termMonths} meses`);
      console.log(`      - Credit Score: ${property.tenantScore}/100`);

      const tx = await rentalNft.mint(
        wallet.address,
        property.agreementId,
        property.rentAmount,
        property.termMonths,
        property.tenantScore,
        property.propertyName,
        property.location
      );

      console.log(`      📤 Transacción enviada: ${tx.hash}`);
      const receipt = await tx.wait();

      // Obtener el tokenId del evento (asumiendo que es index + 1)
      const tokenId = index + 1;
      mintedTokenIds.push(tokenId);

      console.log(`      ✅ NFT #${tokenId} creado exitosamente!`);
    } catch (error: any) {
      console.error(`      ❌ Error creando NFT:`, error.message);
    }
  }

  console.log('\n---\n');

  // PASO 4: Verificar NFTs creados
  console.log('🔍 PASO 4: Verificando NFTs creados...');
  try {
    const nftBalance = await rentalNft.balanceOf(wallet.address);
    console.log(`✅ Total de NFTs en tu wallet: ${nftBalance.toString()}`);

    for (const tokenId of mintedTokenIds) {
      try {
        const owner = await rentalNft.ownerOf(tokenId);
        const data = await rentalNft.getAgreementData(tokenId);
        console.log(`\n   NFT #${tokenId}:`);
        console.log(`   - Propiedad: ${data.propertyName}`);
        console.log(`   - Ubicación: ${data.location}`);
        console.log(`   - Renta: ${ethers.formatEther(data.rentAmount)} wMXNB/mes`);
        console.log(`   - Plazo: ${data.termMonths} meses`);
        console.log(`   - Credit Score: ${data.tenantScore}/100`);
        console.log(`   - Owner: ${owner}`);
      } catch (error: any) {
        console.log(`   ⚠️  NFT #${tokenId} no encontrado (puede ser normal si falló el mint)`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error verificando NFTs:', error.message);
  }

  console.log('\n---\n');

  // PASO 5: Aprobar NFTs para el protocolo (opcional, pero útil para testing)
  console.log('🔐 PASO 5: Aprobando wMXNB para el protocolo...');
  try {
    const approveAmount = ethers.parseEther('50000'); // Aprobar 50,000 wMXNB
    const tx = await wmxnb.approve(LENDING_PROTOCOL_ADDRESS, approveAmount);
    console.log('   📤 Transacción enviada:', tx.hash);
    await tx.wait();
    console.log('   ✅ Aprobación completada!');
  } catch (error: any) {
    console.error('   ❌ Error en aprobación:', error.message);
  }

  console.log('\n---\n');

  // Resumen final
  console.log('🎉 SETUP COMPLETADO!\n');
  console.log('📊 RESUMEN:');
  console.log('   ✅ Tokens wMXNB minteados');
  console.log('   ✅ NFTs de contratos de alquiler creados');
  console.log('   ✅ Aprobaciones configuradas');
  console.log('\n🌐 DIRECCIONES DE CONTRATOS:');
  console.log('   wMXNB:', WMXNB_ADDRESS);
  console.log('   RentalNFT:', RENTAL_NFT_ADDRESS);
  console.log('   LendingProtocol:', LENDING_PROTOCOL_ADDRESS);
  console.log('\n🔗 BLOCK EXPLORER:');
  console.log('   https://blockscout-passet-hub.parity-testnet.parity.io/address/' + wallet.address);
  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('   1. Ejecuta: npm run dev');
  console.log('   2. Visita: http://localhost:3000');
  console.log('   3. Conecta tu wallet en la aplicación');
  console.log('   4. Prueba solicitar un préstamo usando uno de los NFTs');
  console.log('\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
