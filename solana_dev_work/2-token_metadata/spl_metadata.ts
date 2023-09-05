import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, sendAndConfirmTransaction} from "@solana/web3.js";
import { CreateMetadataAccountV3InstructionAccounts, createCreateMetadataAccountV3Instruction, DataV2, CreateMetadataAccountV3InstructionArgs } from "@metaplex-foundation/mpl-token-metadata";
import { readFileSync } from 'fs';
import wallet from "../dev-wallet.json"

const keypairData = JSON.parse(readFileSync('../challenge_one/payerKeypair.json', 'utf-8'));
const payer = Keypair.fromSecretKey(new Uint8Array(keypairData.secretKey));

const mintAuthority = Keypair.fromSecretKey(new Uint8Array(wallet));

const mintID = 'b1LGanWPvSFzJoiZkDUFQtgYo1wwrdjC6FF7Gc2qUac';
const mintPublicKey = new PublicKey(mintID);

const connection = new Connection(
  clusterApiUrl('devnet'),
  'confirmed'
);

const token_metadata_program_id = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const metadata_seeds = [
  Buffer.from('metadata'),
  token_metadata_program_id.toBuffer(),
  mintPublicKey.toBuffer()
]

const [metadata_pda, bump] = PublicKey.findProgramAddressSync(
  metadata_seeds, token_metadata_program_id
)

console.log(metadata_pda); // 3wLZs3fANDM4isZy6jxSMiTXpErCvPM432J8BvPXopr4

/* Create a new Transaction 
  - add a createCreateMetadataAccountV3Instruction to it
  - add the required Accounts and Data
  - use sendAndConfirmTransaction to send it to Devnet
*/

// Create new metadata account for instructions
const accounts: CreateMetadataAccountV3InstructionAccounts = {
  metadata: metadata_pda,
  mint: mintPublicKey,
  mintAuthority: mintAuthority.publicKey,
  payer: payer.publicKey,
  updateAuthority: mintAuthority.publicKey
}

// Token Metadata
const myDataV2: DataV2 = {
  collection: null,
  creators: null,
  name: "MyTokenName",
  sellerFeeBasisPoints: 0,  // No fee for fungible tokens in this example
  symbol: "MTN",
  uri: "",
  uses: null
};

// Create new metadata account for instruction args
const args: CreateMetadataAccountV3InstructionArgs = {
  createMetadataAccountArgsV3: {
    data: myDataV2,
    isMutable: true,
    collectionDetails: null
  }
};

// Building a transaction
const tx = new Transaction().add(
  createCreateMetadataAccountV3Instruction(accounts, args),
);

// Sending the transaction
(async () => {
  try {
    const transactionSignature = await sendAndConfirmTransaction(connection, tx, [payer, mintAuthority], {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    console.log(`Transaction was confirmed with signature: ${transactionSignature}`);
  } catch (e) {
    console.error(`Error sending transaction: ${e}`);
  }
})();

// Transaction confirmed: 5QF9KhxmnmypPbYhpLByuKnZp8LhBk32dD624mBeU2r8ZtyAzXM77tV4Ap63qh3S3Wn3Y9vY41QtJKeyEHMWYy3K