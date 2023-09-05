import { Connection, Keypair, SystemProgram, PublicKey } from "@solana/web3.js"
import { Program, Wallet, AnchorProvider, Address } from "@project-serum/anchor"
import { IDL, WbaVault } from "./wba-vault";
import wallet from "../dev-wallet.json"

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet))

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed"});

// Create our program
const program = new Program<WbaVault>(IDL, "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address, provider);

// Holds the state data of the vault
const vaultState = Keypair.generate();
console.log(`Vault public key: ${vaultState.publicKey.toBase58()}`);
// 9biFhyUuwfRcuDbkDB16jixS4D3jdxTKVRxUoUhri6ac

// Likely used for authorization logic (PDA)
const vaultAuth = PublicKey.findProgramAddressSync([Buffer.from("auth"), vaultState.publicKey.toBuffer()], program.programId)[0];
console.log(vaultAuth.toBase58());
// BZjVNndbttWfCDWBRwCgCRvvcNXGsLfiQnxF4rUzqxsZ

// Could act as an actual vault of perform other functions (PDA)
const vault = PublicKey.findProgramAddressSync([Buffer.from("vault"), vaultAuth.toBuffer()], program.programId)[0];
console.log(vault.toBase58());
// 4o7aMLof1ZiTuU7mwNZoWRhyDpKR9BdJAgn5HYxdqPG8

// Send transaction to initialize WBA vault
(async () => {
  try {
  const txhash = await program.methods.initialize()
  .accounts({
  owner: keypair.publicKey,
  vaultState: vaultState.publicKey,
  vaultAuth: vaultAuth,
  vault: vault,
  systemProgram: SystemProgram.programId,
  }).signers([keypair, vaultState]).rpc();
  console.log(`Success! Check out your TX here:
  https://explorer.solana.com/tx/${txhash}?cluster=devnet`); } catch(e) {
  console.error(`Oops, something went wrong: ${e}`) }
})();

// TX confirmed: 2CW6rWo5gjYVi329ETa363LpXxHuddg1QremVJYBNgkQ2xHZxF9U2mzgBsZdEXPjhNe3SxM1oMV5Q5eGwvg6A2j3