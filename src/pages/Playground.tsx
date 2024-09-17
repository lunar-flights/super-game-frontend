import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import useLocalWallet from "../hooks/useLocalWallet";
import useProgram from "../hooks/useProgram";
import IsometricMap from "../components/IsometricMap";

global.Buffer = global.Buffer || require("buffer").Buffer;

const Playground: React.FC = () => {
  const location = useLocation();
  const program = useProgram();
  const { wallet, getPublicKey } = useLocalWallet();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const gamePda = searchParams.get("game");

  useEffect(() => {
    const fetchGameData = async () => {
      if (!program || !gamePda) {
        console.error("Program or gamePda not initialized");
        return;
      }

      try {
        const gamePublicKey = new PublicKey(gamePda);

        // @ts-ignore
        const gameAccount = await program.account.game.fetch(gamePublicKey);

        console.log("Fetched game data:", gameAccount);
        setGameData(gameAccount);
      } catch (error) {
        console.error("Error fetching game data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [program, gamePda]);

  if (loading) {
    return <div>Loading game data...</div>;
  }

  if (!gameData) {
    return <div>Error loading game data. Please try again later.</div>;
  }

  return (
    <div>
      <IsometricMap gameData={gameData} playerPublicKey={getPublicKey()} />
    </div>
  );
};

export default Playground;
