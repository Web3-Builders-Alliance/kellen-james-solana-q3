**Challenge Two**

*spl_metadata.ts*
  - Use findProgramAddressSync to get the PDA for the Metadata for your mint.
  - Create a new Transaction
    - add a createCreateMetadataAccountV3Instruction to it
    - add the required Accounts and Data
    - use sendAndConfirmTransaction to send it to Devnet

*spl_transfer.ts*
  - Transfer tokens to another cadet.
  - use getOrCreateAssociatedTokenAccount to get the token accounts