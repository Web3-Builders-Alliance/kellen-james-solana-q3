import { createMint } from '@solana/spl-token';
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';
import wallet from "../dev-wallet.json"

const keypairData = JSON.parse(readFileSync('payerKeypair.json', 'utf-8'));
const payer = Keypair.fromSecretKey(new Uint8Array(keypairData.secretKey));

const mintAuthority = Keypair.fromSecretKey(new Uint8Array(wallet))

const connection = new Connection(
  clusterApiUrl('devnet'),
  'confirmed'
);

(async () => {
  try {
    const mint = await createMint(
      connection,
      payer,
      mintAuthority.publicKey,
      null,
      6 // USDC stablecoin decimal representation
      );
      console.log(mint.toBase58());
    } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();