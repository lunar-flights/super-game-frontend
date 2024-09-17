import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import useProgram from "../hooks/useProgram";
import useLocalWallet from "../hooks/useLocalWallet";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const program = useProgram();
  const { wallet, getPublicKey } = useLocalWallet();
  const [playerProfile, setPlayerProfile] = useState(null);

  const requestAirdrop = async () => {
    try {
      const playerPublicKey = getPublicKey();
      if (!playerPublicKey || !program) {
        console.error("Program not initialized or wallet not found.");
        return;
      }
      const connection = program!.provider.connection;
      const balance = await connection.getBalance(playerPublicKey);
      console.log("SOL Balance:", balance / 1e9);
      if (balance < 1e9) {
        await connection.requestAirdrop(playerPublicKey, 1e9);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const createPlayerProfile = async (playerPublicKey: PublicKey, playerProfilePda: PublicKey) => {
    try {
      if (!program) {
        console.error("Program not initialized.");
        return;
      }

      await program.methods
        .createPlayerProfile()
        .accounts({
          player: playerPublicKey,
          playerProfile: playerProfilePda,
        })
        .rpc();

      console.log("Created player profile account:", playerProfilePda.toBase58());

      // @ts-ignore
      const profile = await program.account.playerProfile.fetch(playerProfilePda);
      setPlayerProfile(profile);
      console.log("Player profile:", profile);
    } catch (error) {
      console.error("Error creating player profile:", error);
    }
  };

  const checkPlayerProfile = async () => {
    try {
      const playerPublicKey = getPublicKey();
      if (!playerPublicKey || !program) {
        console.error("Program not initialized or wallet not found.");
        return;
      }

      const [playerProfilePda] = await PublicKey.findProgramAddressSync(
        [Buffer.from("PROFILE"), playerPublicKey.toBuffer()],
        program.programId
      );

      try {
        // @ts-ignore
        const profile = await program.account.playerProfile.fetch(playerProfilePda);
        console.log("Player Profile:", profile);
        setPlayerProfile(profile);
      } catch (error) {
        console.log("Player profile not found. Creating new profile...");
        await createPlayerProfile(playerPublicKey, playerProfilePda);
      }
    } catch (error) {
      console.error("Error fetching player profile:", error);
    }
  };

  const createPlaygroundGame = async () => {
    try {
      if (!program) {
        console.error("Program not initialized.");
        return;
      }

      const playerPublicKey = getPublicKey();
      if (!playerPublicKey) {
        console.error("Wallet not found.");
        return;
      }

      const [superStatePda] = await PublicKey.findProgramAddressSync([Buffer.from("SUPER")], program.programId);
      const [playerProfilePda] = await PublicKey.findProgramAddressSync(
        [Buffer.from("PROFILE"), playerPublicKey.toBuffer()],
        program.programId
      );

      // @ts-ignore
      const superState = await program.account.superState.fetch(superStatePda);
      console.log("Super state:", superState);
      let gameId = superState.gameCount;
      const [gamePda] = await PublicKey.findProgramAddressSync(
        [Buffer.from("GAME"), new anchor.BN(gameId).toArrayLike(Buffer, "le", 4)],
        program.programId
      );

      // max_players = 2, is_multiplayer = false, map_size = small
      await program.methods
        .createGame(2, false, { small: {} })
        .accounts({
          superState: superStatePda,
          game: gamePda,
          creator: playerPublicKey,
        })
        .rpc();

      console.log("Created game:", gamePda.toBase58());
      // @ts-ignore
      const game = await program.account.game.fetch(gamePda);
      console.log("Game:", game);

      return gamePda.toBase58();
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handlePlaygroundClick = async () => {
    await requestAirdrop();
    await checkPlayerProfile();
    const gameId = await createPlaygroundGame();
    
    if (gameId) {
      navigate(`/playground?game=${gameId}`);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <button onClick={handlePlaygroundClick} style={{ padding: "20px", fontSize: "20px" }}>
        Playground
      </button>
    </div>
  );
};

export default HomePage;
