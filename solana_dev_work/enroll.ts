import { Connection, Keypair, SystemProgram, PublicKey } from "@solana/web3.js"
import { Program, Wallet, AnchorProvider, Address } from "@project-serum/anchor"
import { IDL } from "./programs/wba_prereq";
import { Idl } from "@project-serum/anchor";
import wallet from "./wba-cert.json"

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet))

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Github Account
const github = Buffer.from("Kellenkjames", "utf8")

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed"});

// Create our program
const program = new Program<Idl>(IDL, "HC2oqz2p6DEWfrahenqdq2moUcga9c9biqRBcdK3XKU1" as Address, provider);

// Create the PDA for our enrollment account
const enrollment_seeds = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

// Execute our enrollment transaction
(async () => {
  try {
  const txhash = await program.methods.complete(github)
  .accounts({
  signer: keypair.publicKey,
  prereq: enrollment_key,
  systemProgram: SystemProgram.programId,
  }).signers([keypair ]).rpc();
  console.log(`Success! Check out your TX here:
  https://explorer.solana.com/tx/${txhash}?cluster=devnet`); } catch(e) {
  console.error(`Oops, something went wrong: ${e}`) }
  })();