import { Connection, clusterApiUrl, PublicKey, Keypair } from '@solana/web3.js';
import { transfer, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { readFileSync } from 'fs';

const keypairData = JSON.parse(readFileSync('../challenge_1/payerKeypair.json', 'utf-8'));
const payer = Keypair.fromSecretKey(new Uint8Array(keypairData.secretKey));

const connection = new Connection(
  clusterApiUrl('devnet'),
  'confirmed'
);

const mintID = 'b1LGanWPvSFzJoiZkDUFQtgYo1wwrdjC6FF7Gc2qUac';
const mintPublicKey = new PublicKey(mintID);

const sourcePublicKey = new PublicKey('54KY7H7F5ncRx3de3VKGwxkaJFeU2TWzTNDHVCCMAS1T'); // Source: ATA Address
const destinationPublicKey = new PublicKey('BvhV49WPYBbzPu8Fpy8YnPnwhNWLbm9Vmdj2T5bNSotS');

// Define the Amount to Transfer
const decimals = 6;
const amountToTransfer = 0.5 * Math.pow(10, decimals);  // 500000

(async () => {
  try {
    // Create the ATA for destination account (if necessary)
    const destinationATA = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPublicKey,
      destinationPublicKey
    )
    // Transfer tokens from source ATA to destination ATA
    const transferSignature = await transfer(
      connection,
      payer,
      sourcePublicKey,
      destinationATA.address,
      payer,
      amountToTransfer,
      []
    )
  } catch(e) { console.error(`Oops, something went wrong: ${e}`) };
})();

/* Transaction Success 🎉
https://explorer.solana.com/address/54KY7H7F5ncRx3de3VKGwxkaJFeU2TWzTNDHVCCMAS1T?cluster=devnet
https://explorer.solana.com/address/BvhV49WPYBbzPu8Fpy8YnPnwhNWLbm9Vmdj2T5bNSotS/tokens?cluster=devnet
*/