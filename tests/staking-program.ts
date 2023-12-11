import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingProgram } from "../target/types/staking_program";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

describe("staking-program", () => {
  // Configure the client to use the local cluster.
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const payer = provider.wallet as anchor.Wallet;
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const mintKeypair = Keypair.fromSecretKey(new Uint8Array([
    81, 179,   3, 211,   3, 100, 102, 123, 154, 204,  93,
    99,  22, 163,   9, 212,  80, 244,  84, 140,  12, 218,
    29,  24,  87, 182, 212, 123, 224, 144,  87,  46,  98,
    30,  93, 206, 172, 137, 184, 236,  27,  78,  67, 109,
     2, 214, 190,  53, 151, 241,  91, 240, 225, 216,  45,
   171, 195, 189, 167, 156,  89,  86,  28, 155
  ]));
  console.log(mintKeypair); 

  const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

  async function createMintToken() {
    const mint = await createMint(
      connection,
      payer.payer,
      payer.publicKey,
      payer.publicKey,
      9,
      mintKeypair
    );
    console.log(mint);
  };

  it("Is initialized!", async () => {

    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    )

    const tx = await program.methods.initialize()
      .accounts({
        signer: payer.publicKey,
        tokenVaultAccount: vaultAccount,
        mint: mintKeypair.publicKey
      }).rpc();

    console.log("Your transaction signature", tx);
  });


  it("stake",async () => {

    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    await mintTo(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      userTokenAccount.address,
      payer.payer,
      1e11,
    )

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId,
    )

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId,
    )

    await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey
    )

    const tx = await program.methods
      .stake(new anchor.BN(1))
      .signers([payer.payer])
      .accounts({
        stakeInfoAccount: stakeInfo,
        stakeAccount: stakeAccount,
        userTokenAccount: userTokenAccount.address,
        mint: mintKeypair.publicKey,
        signer: payer.publicKey
      }
      )
      .rpc();
    console.log("Your transaction signature", tx);
  })

  it("destake",async () => {

    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId,
    )

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId,
    )

    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    )

    await mintTo(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      vaultAccount,
      payer.payer,
      1e21
    );

    const tx = await program.methods
      .destake()
      .signers([payer.payer])
      .accounts({
        stakeAccount: stakeAccount,
        stakeInfoAccount: stakeInfo,
        userTokenAccount: userTokenAccount.address,
        tokenVaultAccount: vaultAccount,
        signer: payer.publicKey,
        mint: mintKeypair.publicKey,

      })
      .rpc();
    console.log("Your transaction signature", tx);


  });

});
