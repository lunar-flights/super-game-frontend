import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "react-toastify";
import useProgram from "./useProgram";
import useLocalWallet from "./useLocalWallet";

const usePlayerSetup = () => {
  const program = useProgram();
  const { getPublicKey } = useLocalWallet();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async (): Promise<number> => {
    const playerPublicKey = getPublicKey();
    if (!playerPublicKey || !program) {
      console.error("Program not initialized or wallet not found.");
      return 0;
    }
    try {
      const connection = program!.provider.connection;
      const balance = await connection.getBalance(playerPublicKey);
      setSolBalance(balance / 1e9);
      return balance;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  };

  const requestAirdrop = async () => {
    try {
      const playerPublicKey = getPublicKey();
      if (!playerPublicKey || !program) {
        console.error("Program not initialized or wallet not found.");
        return;
      }
      const balance = await checkBalance();
      if (balance < 1e9 * 0.1) {
        const connection = program!.provider.connection;
        await connection.requestAirdrop(playerPublicKey, 1e9);
        await checkBalance();
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast.error("Failed to request airdrop. Please use faucet.");
      setError("Airdrop failed. Please request SOL from the faucet.");
      // throw error;
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
      toast.error("Failed to create player profile.");
      console.error("Error creating player profile:", error);
      setError("Failed to create player profile. Please ensure you have enough SOL.");
      // throw error;
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
      setError("New player? Failed to fetch or create player profile. Please retry.");
      // throw error;
    }
  };

  return {
    solBalance,
    playerProfile,
    checkBalance,
    requestAirdrop,
    checkPlayerProfile,
    error,
    setError,
  };
};

export default usePlayerSetup;
