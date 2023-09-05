import { clusterApiUrl, Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../dev-wallet.json"

const mintAuthority = Keypair.fromSecretKey(new Uint8Array(wallet))

const connection = new Connection(
  clusterApiUrl('devnet'),
  'confirmed'
);

const mintID = 'b1LGanWPvSFzJoiZkDUFQtgYo1wwrdjC6FF7Gc2qUac';
const mintPublicKey = new PublicKey(mintID);

// Get or create associated token account
(async () => {
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    mintAuthority,
    mintPublicKey,
    mintAuthority.publicKey
  );

  // Mint token to associated token account
  const mintToken = await mintTo(
    connection,
    mintAuthority,
    mintPublicKey,
    ata.address,
    mintAuthority,
    1000000
  );

  // Check new mint supply and token balance
  const mintInfo = await getMint(connection, mintPublicKey);
  console.log(mintInfo.supply);
})();