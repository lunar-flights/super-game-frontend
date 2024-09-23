import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import useLocalWallet from "../hooks/useLocalWallet";
import useProgram from "../hooks/useProgram";
import IsometricMap from "../components/IsometricMap";
import "./Playground.css";

global.Buffer = global.Buffer || require("buffer").Buffer;

const Playground: React.FC = () => {
  const location = useLocation();
  const program = useProgram();
  const { wallet, getPublicKey } = useLocalWallet();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const gamePda = searchParams.get("game");

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
    } catch (error) {
      console.error("Error fetching game data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTurn = async () => {
    if (!program || !getPublicKey() || !gamePda) {
      console.error("Program, publicKey, or gameData not initialized");
      return;
    }

    try {
      const gamePublicKey = new PublicKey(gamePda);

      await program.methods
        .endTurn()
        .accounts({
          game: gamePublicKey,
        })
        .rpc();

      fetchGameData();
    } catch (error) {
      console.error("Error ending turn:", error);
    }
  };


  useEffect(() => {
    fetchGameData();
  }, [program, gamePda]);

  if (loading) {
    return <div>Loading game data...</div>;
  }

  if (!gameData) {
    return <div>Error loading game data. Please try again later.</div>;
  }

  return (
    <div className="playground-container">
      <IsometricMap gameData={gameData} playerPublicKey={getPublicKey()} fetchGameData={fetchGameData} />
      <button className="end-turn-button" onClick={handleEndTurn}>
        End Turn
      </button>
    </div>
  );
};

export default Playground;
