import { Connection, Keypair, SystemProgram } from "@solana/web3.js"
import { Program, Wallet, AnchorProvider, Address } from "@project-serum/anchor"
import * as anchor from "@project-serum/anchor";
import { IDL, WbaVault } from "./wba-vault";
import wallet from "../dev-wallet.json";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet))

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed"});

// Create our program
const program = new Program<WbaVault>(IDL, "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address, provider);

// Load vaults (public keys)
const vaultState = '9biFhyUuwfRcuDbkDB16jixS4D3jdxTKVRxUoUhri6ac';
const vaultAuth = 'BZjVNndbttWfCDWBRwCgCRvvcNXGsLfiQnxF4rUzqxsZ';
const vault = '4o7aMLof1ZiTuU7mwNZoWRhyDpKR9BdJAgn5HYxdqPG8';

const amountToWithdraw = new anchor.BN(5000);

// Withdraw native Solana
(async () => {
  try {
  const txhash = await program.methods.withdraw(amountToWithdraw)
  .accounts({
  owner: keypair.publicKey,
  vaultState,
  vaultAuth,
  vault,
  systemProgram: SystemProgram.programId,
  }).signers([keypair]).rpc();
  console.log(`Success! Check out your TX here:
  https://explorer.solana.com/tx/${txhash}?cluster=devnet`); } catch(e) {
  console.error(`Oops, something went wrong: ${e}`) }
})();

// Tx confirmed: 5uA19akoZimgkG9gQuqybGqQ8dXsCtFFHHNN3S1YSJSR3BRoncb8kRwPuGiqmZ9429ZZLqfdSttwCabJdWXBcxrV