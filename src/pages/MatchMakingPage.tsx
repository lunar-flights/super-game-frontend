import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { ToastContainer, toast } from "react-toastify";
import useProgram from "../hooks/useProgram";
import useLocalWallet from "../hooks/useLocalWallet";
import "./MatchMakingPage.css";

const MatchMakingPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const program = useProgram();
  const { getPublicKey } = useLocalWallet();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const gamePda = gameId;

  useEffect(() => {
    if (!gamePda) {
      navigate("/");
      return;
    }
    fetchGameData();

    // Check game status every 5 seconds
    const intervalId = setInterval(() => {
      fetchGameData();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [program, gamePda]);

  const fetchGameData = async () => {
    if (!program || !gamePda) {
      console.error("Program or gamePda not initialized");
      return;
    }

    try {
      const gamePublicKey = new PublicKey(gamePda);

      // @ts-ignore
      const gameAccount = await program.account.game.fetch(gamePublicKey);
      gameAccount.gamePda = gamePda;
      console.log("Fetched game data:", gameAccount);
      setGameData(gameAccount);

      if (gameAccount.status && gameAccount.status.live) {
        toast.success("Opponent has joined. Starting game...");
        navigate(`/playground?game=${gamePda}`);
      } else if (gameAccount.status && gameAccount.status.notStarted) {
        // if player is not in game, try to join
        const playerPublicKey = getPublicKey();
        const isPlayerInGame = gameAccount.players.some(
          (p: any) => p && p.pubkey && p.pubkey.toBase58() === playerPublicKey?.toBase58()
        );
        if (!isPlayerInGame) {
          joinGame();
        }
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
      toast.error("Error fetching game data.");
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!program || !gamePda) {
      console.error("Program or gamePda not initialized");
      return;
    }
    try {
      const gamePublicKey = new PublicKey(gamePda);
      const playerPublicKey = getPublicKey();

      if (!playerPublicKey) {
        console.error("Player public key not found");
        return;
      }

      const [playerProfilePda] = await PublicKey.findProgramAddressSync(
        [Buffer.from("PROFILE"), playerPublicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .joinGame()
        .accounts({
          game: gamePublicKey,
          player: playerPublicKey,
          playerProfile: playerProfilePda,
        })
        .rpc();

      toast.success("Joined the game successfully!");
      fetchGameData();
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join the game.");
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast.info("Invite link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="matchmaking-container">
        <div className="status-message">
          <h2>Loading game data...</h2>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="matchmaking-container">
        <div className="status-message">
          <h2>Error loading game data. Please try again later.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="matchmaking-container">
      <ToastContainer autoClose={2500} theme="dark" />
      <div className="status-message">
        <div className="spinner"></div>
        <h2>Waiting for your opponent...</h2>
      </div>
      <div className="invite-link-container">
        <p>Invite opponent using this link:</p>
        <div className="invite-link">
          <pre>{window.location.href}</pre>
          <button onClick={handleCopyLink}>Copy</button>
        </div>
      </div>
    </div>
  );
};

export default MatchMakingPage;
