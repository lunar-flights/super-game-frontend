import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faVolumeUp, faVolumeMute } from "@fortawesome/free-solid-svg-icons";
import soundManager from "../SoundManager";
import useLocalWallet from "../hooks/useLocalWallet";
import useProgram from "../hooks/useProgram";
import IsometricMap from "../components/IsometricMap";
import ProductionPanel from "../components/ProductionPanel";
import HelpModal from "../components/HelpModal";
import Chat from "../components/Chat";
import GameOverModal from "../components/GameOverModal";
import "./Playground.css";

global.Buffer = global.Buffer || require("buffer").Buffer;

interface GameData {
  players: any; // Player[];
  tiles: any; //Tile[][];
  status: any;
  winner: any;
  round: number;
  isMultiplayer: boolean;
  turnTimestamp: number;
  currentPlayerIndex: number;
}

const Playground: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const program = useProgram();
  const { wallet, getPublicKey } = useLocalWallet();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<any | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [solanaTimeOffset, setSolanaTimeOffset] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(60);

  const searchParams = new URLSearchParams(location.search);
  const gamePda = searchParams.get("game");

  const [isMusicOn, setIsMusicOn] = useState(soundManager.isMusicEnabled());

  const handleToggleMusic = () => {
    soundManager.toggleBackgroundMusic();
    setIsMusicOn(soundManager.isMusicEnabled());
  };

  useEffect(() => {
    if (soundManager.isMusicEnabled()) {
      soundManager.playBackgroundMusic();
    }

    return () => {
      soundManager.stopBackgroundMusic();
    };
  }, []);

  const fetchSolanaTimeOffset = async () => {
    if (!program) {
      return;
    }
    try {
      const connection = program.provider.connection;
      const slot = await connection.getSlot();
      const blockTime = await connection.getBlockTime(slot);
      if (blockTime !== null) {
        const localTimestamp = Math.floor(Date.now() / 1000);
        const offset = blockTime - localTimestamp;
        setSolanaTimeOffset(offset);
      }
    } catch (error) {
      console.error("Error fetching Solana clock:", error);
    }
  };

  const subscriptionIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gamePda) {
      navigate("/");
      return;
    }

    fetchGameData();
  }, [program, gamePda]);

  useEffect(() => {
    if (!program) return;

    fetchSolanaTimeOffset();

    const intervalId = setInterval(() => {
      fetchSolanaTimeOffset();
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [program]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (gameData && gameData.turnTimestamp) {
      intervalId = setInterval(() => {
        const localTimestamp = Math.floor(Date.now() / 1000);
        const estimatedSolanaTimestamp = localTimestamp + solanaTimeOffset;

        const turnStartTime = gameData.turnTimestamp;
        const elapsedTime = estimatedSolanaTimestamp - turnStartTime;
        const maxTurnDuration = 60;

        const timeLeft = Math.max(maxTurnDuration - elapsedTime, 0);
        setRemainingTime(Math.floor(timeLeft));

        if (timeLeft <= 0) {
          fetchGameData();
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [gameData, solanaTimeOffset]);

  useEffect(() => {
    if (!gamePda || !program || !gameData) {
      return;
    }

    const gamePublicKey = new PublicKey(gamePda);

    if (gameData.isMultiplayer) {
      // Set up subscription
      try {
        subscriptionIdRef.current = program.provider.connection.onAccountChange(gamePublicKey, async (accountInfo) => {
          try {
            // @ts-ignore
            const gameAccount = program.account.game.coder.accounts.decode("game", accountInfo.data);
            gameAccount.gamePda = gamePda;
            console.log("Account changed:", gameAccount);
            setGameData(gameAccount);
          } catch (error) {
            console.error("Error decoding game account data:", error);
          }
        });
      } catch (error) {
        console.error("Error setting up account subscription:", error);
        toast.error("Error setting up account subscription. Please refresh the page.");
      }
    }

    return () => {
      if (subscriptionIdRef.current !== null) {
        program.provider.connection.removeAccountChangeListener(subscriptionIdRef.current);
      }
    };
  }, [program, gamePda, gameData?.isMultiplayer]);

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
    if (isEndingTurn) {
      return;
    }
    setIsEndingTurn(true);
    try {
      const gamePublicKey = new PublicKey(gamePda);
      const prevGameData = gameData;

      await program.methods
        .endTurn()
        .accounts({
          game: gamePublicKey,
        })
        .rpc();

      // @ts-ignore
      const gameAccount = await program.account.game.fetch(gamePublicKey);
      gameAccount.gamePda = gamePda;
      console.log("Fetched game data:", gameAccount);

      let attackHappened = false;
      if (prevGameData && prevGameData.tiles && gameAccount.tiles) {
        const rows = prevGameData.tiles.length;
        const cols = prevGameData.tiles[0].length;
        outerLoop: for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const prevTile = prevGameData.tiles[i][j];
            const newTile = gameAccount.tiles[i][j];
            if (prevTile || newTile) {
              const prevOwner = prevTile && prevTile.owner ? prevTile.owner.toBase58() : null;
              const newOwner = newTile && newTile.owner ? newTile.owner.toBase58() : null;
              if (prevOwner !== newOwner) {
                attackHappened = true;
                break outerLoop;
              }
            }
          }
        }
      }

      setGameData(gameAccount);

      if (attackHappened) {
        soundManager.play("shots");
      } else {
        soundManager.play("ding");
      }
      toast.success(`Round ${gameAccount.round}`);
    } catch (error) {
      console.error("Error ending turn:", error);
      if (error instanceof Error && error.message.includes("NotYourTurn")) {
        toast.error("Not your turn");
      } else {
        toast.error("Error ending turn.");
      }
    } finally {
      setIsEndingTurn(false);
    }
  };

  const handleRecruitUnits = async (unitType: string, quantity: number) => {
    if (!program || !getPublicKey() || !gamePda || !selectedTile) {
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
        .recruitUnits(unitTypeMap[unitType], quantity, selectedTile.row, selectedTile.col)
        .accounts({
          game: gamePublicKey,
        })
        .rpc();

      fetchGameData();
      setSelectedTile(null);
    } catch (error) {
      console.error("Error recruiting units:", error);
      if (error instanceof Error && error.message.includes("TileNotOwned")) {
        toast.error("You don't control this tile");
      }
      if (error instanceof Error && error.message.includes("DifferentUnitTypeOnTile")) {
        toast.error("Tile is occupied by a different unit type.");
      }
    }
  };

  const handleUpgradeBase = async () => {
    try {
      if (!program || !getPublicKey() || !selectedTile || !gamePda) return;

      const gamePublicKey = new PublicKey(gamePda);

      await program.methods
        .buildConstruction(selectedTile.row, selectedTile.col, { base: {} })
        .accounts({
          game: gamePublicKey,
        })
        .rpc();

      fetchGameData();
      toast.success("Capital upgraded successfully.");
      setSelectedTile(null);
    } catch (error) {
      console.error("Error upgrading capital:", error);
      let errorMessage = "Unknown error";
      if (error instanceof Error) errorMessage = error.message;
      if (errorMessage.includes("MaxLevelReached")) errorMessage = "Capital is already at max level.";
      if (errorMessage.includes("NotEnoughFunds")) errorMessage = "Not enough funds to upgrade capital.";
      toast.error(errorMessage);
    }
  };

  const handleBuildConstruction = async (buildingType: any) => {
    try {
      if (!program || !getPublicKey() || !selectedTile || !gamePda) return;

      const gamePublicKey = new PublicKey(gamePda);

      await program.methods
        .buildConstruction(selectedTile.row, selectedTile.col, buildingType)
        .accounts({
          game: gamePublicKey,
        })
        .rpc();

      fetchGameData();
      toast.success("Construction built successfully.");
    } catch (error) {
      console.error("Error building construction:", error);
      let errorMessage = "Unknown error";
      if (error instanceof Error) errorMessage = error.message;
      if (errorMessage.includes("MaxLevelReached")) errorMessage = "Building is already at max level.";
      if (errorMessage.includes("NotEnoughFunds")) errorMessage = "Not enough funds to build.";
      if (errorMessage.includes("BuildingTypeMismatch")) errorMessage = "Tile already has a building.";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (!gamePda) {
      navigate("/");
      return;
    }
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
  const playerColors = ["#d73a3a", "#ffa500", "#387ad7", "#2bcf5e"];
  const playerColor = playerColors[playerIndex % playerColors.length];
  const playerNames = ["Red", "Orange", "Blue", "Green"];
  const playerName = playerNames[playerIndex % 4];

  const currentPlayerIndex = gameData.currentPlayerIndex;
  const currentPlayerName = playerNames[currentPlayerIndex % playerNames.length];

  const getButtonLabel = () => {
    let endTurnLabel = <span>End turn</span>;
    if (gameData.isMultiplayer) {
      if (playerIndex === currentPlayerIndex) {
        endTurnLabel = (
          <span>
            End your turn <b>{remainingTime}s</b>
          </span>
        );
      } else {
        endTurnLabel = (
          <>
            <b>{remainingTime > 0 ? `${remainingTime}s ` : "End "}</b>
            <span style={{ color: playerColors[currentPlayerIndex] }}>{currentPlayerName}</span>
            's turn
          </>
        );
      }
    }
    return endTurnLabel;
  };

  return (
    <div className="playground-container">
      <IsometricMap
        gameData={gameData}
        playerPublicKey={getPublicKey()}
        fetchGameData={fetchGameData}
        onTileSelect={setSelectedTile}
      />
      {/* <Chat playerColor={playerColor} playerName={playerName} /> */}

      <button className="end-turn-button" onClick={handleEndTurn}>
        {isEndingTurn ? (
          <>
            <span className="spinner"></span>
          </>
        ) : (
          getButtonLabel()
        )}
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
      {selectedTile && (
        <ProductionPanel
          tileData={selectedTile}
          playerBalance={playerBalance}
          onRecruitUnits={handleRecruitUnits}
          onUpgradeBase={handleUpgradeBase}
          onBuildConstruction={handleBuildConstruction}
          onClose={() => setSelectedTile(null)}
        />
      )}
      <button className="help-button" onClick={() => setIsHelpModalOpen(true)} title="Help">
        <FontAwesomeIcon icon={faQuestionCircle} /> Help
      </button>

      <button
        className="sound-toggle-button"
        onClick={handleToggleMusic}
        title={isMusicOn ? "Mute Music" : "Unmute Music"}
      >
        <FontAwesomeIcon icon={isMusicOn ? faVolumeUp : faVolumeMute} />
      </button>

      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}

      {isGameOverModalOpen && <GameOverModal winner={getWinnerInfo()} onClose={handleModalClose} />}
    </div>
  );
};

export default Playground;
