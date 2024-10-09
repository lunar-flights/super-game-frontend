import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import useLocalWallet from "../hooks/useLocalWallet";
import useProgram from "../hooks/useProgram";
import IsometricMap from "../components/IsometricMap";
import ProductionPanel from "../components/ProductionPanel";
import GameOverModal from "../components/GameOverModal";
import "./Playground.css";

global.Buffer = global.Buffer || require("buffer").Buffer;

interface GameData {
  players: any; // Player[];
  tiles: any; //Tile[][];
  status: any;
  winner: any;
}

const Playground: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const program = useProgram();
  const { wallet, getPublicKey } = useLocalWallet();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTileForProduction, setSelectedTile] = useState<any | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

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

  const handleRecruitUnits = async (unitType: string, quantity: number) => {
    if (!program || !getPublicKey() || !gamePda || !selectedTileForProduction) {
      console.error("Program, publicKey, or gameData not initialized");
      return;
    }

    try {
      const gamePublicKey = new PublicKey(gamePda);

      const unitTypeMap: { [key: string]: any } = {
        Infantry: { infantry: {} },
        Tank: { tank: {} },
        Plane: { plane: {} },
      };

      await program.methods
        .recruitUnits(unitTypeMap[unitType], quantity, selectedTileForProduction.row, selectedTileForProduction.col)
        .accounts({
          game: gamePublicKey,
        })
        .rpc();

      fetchGameData();
      setSelectedTile(null);
    } catch (error) {
      console.error("Error recruiting units:", error);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, [program, gamePda]);

  const getWinnerInfo = () => {
    if (!gameData) return null;

    if (gameData.winner) {
      return gameData.players.find((p: any) => p && p.pubkey && p.pubkey.toBase58() === gameData.winner.toBase58());
    }

    const alivePlayers = gameData.players.filter((p: any) => p && p.isAlive);

    if (alivePlayers.length === 1) {
      return alivePlayers[0];
    }

    return null;
  };

  const handleModalClose = () => {
    setIsGameOverModalOpen(false);
    navigate("/");
  };

  useEffect(() => {
    if (gameData && gameData.status && gameData.status.completed) {
      setIsGameOverModalOpen(true);
    }
  }, [gameData]);

  if (loading) {
    return <div>Loading game data...</div>;
  }

  if (!gameData) {
    return <div>Error loading game data. Please try again later.</div>;
  }

  const playerIndex = gameData.players.findIndex(
    (p: any) => p && p.pubkey && p.pubkey.toBase58() === getPublicKey()?.toBase58()
  );
  const playerInfo = gameData.players[playerIndex];
  const playerBalance = playerInfo ? playerInfo.balance : 0;
  const attackPoints = playerInfo ? playerInfo.attackPoints : 0;

  return (
    <div className="playground-container">
      <IsometricMap
        gameData={gameData}
        playerPublicKey={getPublicKey()}
        fetchGameData={fetchGameData}
        onTileSelect={setSelectedTile}
      />
      <button className="end-turn-button" onClick={handleEndTurn}>
        End Turn
      </button>
      <div className="balance-container">
        <p className="ap-title">Attack points</p>
        <div className={`ap-label ${attackPoints > 0 ? "" : "empty"}`}>
          <img src="/ui/bullet-white.png" alt="Bullet" />
        </div>
        <div className={`ap-label ${attackPoints > 1 ? "" : "empty"}`}>
          <img src="/ui/bullet-white.png" alt="Bullet" />
        </div>
        <div className="balance-label">
          <img src="/ui/credits.png" alt="Balance" />
        </div>
        <div className="balance-value">{playerBalance}</div>
      </div>
      {selectedTileForProduction && (
        <ProductionPanel
          tileData={selectedTileForProduction}
          playerBalance={playerBalance}
          onRecruitUnits={handleRecruitUnits}
          onClose={() => setSelectedTile(null)}
        />
      )}
      {isGameOverModalOpen && <GameOverModal winner={getWinnerInfo()} onClose={handleModalClose} />}
    </div>
  );
};

export default Playground;
