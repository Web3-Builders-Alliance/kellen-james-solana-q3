import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { Program, Wallet, AnchorProvider, Address } from "@project-serum/anchor"
import * as anchor from "@project-serum/anchor";
import { IDL, WbaVault } from "./wba-vault";
import wallet from "../dev-wallet.json";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet))

// Connect to Solana devnet
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed"});

// Create our program
const program = new Program<WbaVault>(IDL, "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address, provider);

// System programs
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Load vaults (public keys)
const vaultState = new PublicKey('9biFhyUuwfRcuDbkDB16jixS4D3jdxTKVRxUoUhri6ac');

// Token mint address
const mint = new PublicKey('b1LGanWPvSFzJoiZkDUFQtgYo1wwrdjC6FF7Gc2qUac');

// Amount to Deposit
const amountToDeposit = new anchor.BN(4200);

(async () => {
  try {

    // Find or derive the Program Derived Address (PDA) for the vault authentication
    const vaultAuth = PublicKey.findProgramAddressSync([Buffer.from("auth"), vaultState.toBuffer()], program.programId)[0];

    // Retrieve the associated owner account, or create it if it doesn't exist
    const ownerAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );

    // Retrieve the associated token account, or create it if it doesn't exist
    const vaultAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      vaultAuth,
      true
      );
      
      // Sending the Transaction
      const txhash = await program.methods.withdrawSpl(amountToDeposit)
      .accounts({
        owner: keypair.publicKey,
        ownerAta: ownerAta.address,
        vaultState,
        vaultAuth,
        vaultAta: vaultAta.address,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      }).signers([keypair]).rpc();
      console.log(`Success! Check out your TX here:
      https://explorer.solana.com/tx/${txhash}?cluster=devnet`); } catch(e) {
      console.error(`Oops, something went wrong: ${e}`) }
    })();

    // Tx Confirmed: Bn1vHqm1RFHfDQsJAaZo1XzewjAopGZHv3xQwHabK33mQsLb1RQJp8Nksbz1FueKcf3BEc5tTDLudDAXrsQYsho