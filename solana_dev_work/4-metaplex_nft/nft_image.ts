import { Metaplex, bundlrStorage, keypairIdentity, toMetaplexFile } from "@metaplex-foundation/js";
import { Keypair, Connection } from "@solana/web3.js";
import * as fs from "fs";
import wallet from "../dev-wallet.json";

const rpcUrl = "https://api.devnet.solana.com/";
const connection = new Connection(rpcUrl, "confirmed");

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet))

const imageBuffer = fs.readFileSync("blue_dream_rug.png");
const file = toMetaplexFile(imageBuffer, "image.jpg");

// Establish connection to Arweave
const METAPLEX = Metaplex.make(connection)
.use(keypairIdentity(keypair))
.use(bundlrStorage({
  address: 'https://devnet.bundlr.network',
  providerUrl: rpcUrl,
  timeout: 60000,
}));

(async () => {
  // Upload the NFT using uploadMetadata method:
  const { uri, metadata } = await METAPLEX.nfts().uploadMetadata({
    name: "Blue Magic Rug",
    symbol: "BMR",
    description: "Blue Magic Rug from Space",
    image: file
  });
  
  // Create the NFT using the image uploaded:
  const { nft } = await METAPLEX.nfts().create({
    uri: uri,
    name: "Blue Magic Rug",
    sellerFeeBasisPoints: 500, // Represents 5.00%
  })
  console.log(uri);
})();

// Uri: https://hhuzhk66aoryc3sms7w2kaa75qk7bfoitpw5q5ugsrjmhjvvzq3q.arweave.net/OemTq94Do4FuTJftpQAf7BXwlcib7dh2hpRSw6a1zDc