import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64, toB64 } from '@mysten/sui.js/utils';

// Generate a new random Ed25519 keypair
const keypair = new Ed25519Keypair();

// Get the private key (as base64)
const privateKeyBase64 = toB64(keypair.export().privateKey);

// Get the public address
const address = keypair.getPublicKey().toSuiAddress();

console.log('New wallet address:', address);
console.log('Private key (base64):', privateKeyBase64);
