import { Keypair } from "@solana/web3.js"
import * as fs from "fs"

// Generate a new keypair
let kp = Keypair.generate()
console.log(`You've generated a new Solana wallet: ${kp.publicKey.toBase58()}`)

// Save the secret key to a JSON file
const secretKeyData = Array.from(kp.secretKey);
fs.writeFileSync("dev-wallet.json", JSON.stringify(secretKeyData, null, 2))