import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { ToastContainer, toast } from "react-toastify";
import useProgram from "../hooks/useProgram";
import useLocalWallet from "../hooks/useLocalWallet";
import usePlayerSetup from "../hooks/usePlayerSetup";
import "./MatchMakingPage.css";

const MatchMakingPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const program = useProgram();
  const { getPublicKey } = useLocalWallet();
  const {
    requestAirdrop,
    checkPlayerProfile,
    error: playerSetupError,
    setError: setPlayerSetupError,
  } = usePlayerSetup();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoiningGame, setIsJoiningGame] = useState<boolean>(false);

  const gamePda = gameId;

  useEffect(() => {
    if (!gamePda) {
      navigate("/");
      return;
    }
    setupPlayerAndFetchGame();

    // Check game status every 5 seconds
    const intervalId = setInterval(() => {
      fetchGameData();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [program, gamePda]);

  const setupPlayerAndFetchGame = async () => {
    try {
      setLoading(true);
      await requestAirdrop();
      await checkPlayerProfile();
      await fetchGameData();
    } catch (error) {
      console.error("Error during player setup:", error);
      setLoading(false);
    }
  };

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
        // if player is not in game, allow manual join
        const playerPublicKey = getPublicKey();
        const isPlayerInGame = gameAccount.players.some(
          (p: any) => p && p.pubkey && p.pubkey.toBase58() === playerPublicKey?.toBase58()
        );
        if (!isPlayerInGame && !isJoiningGame) {
          // joinGame();
        }
      } else if (gameAccount.status && gameAccount.status.completed) {
        setJoinError("This game has already been completed.");
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
      setJoinError("Error fetching game data. Please try again later.");
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
      setIsJoiningGame(true);
      setJoinError(null); // Reset any previous errors
      const gamePublicKey = new PublicKey(gamePda);
      const playerPublicKey = getPublicKey();

      if (!playerPublicKey) {
        console.error("Player public key not found");
        setJoinError("Wallet not found. Please refresh the page.");
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
      await fetchGameData();
    } catch (error) {
      console.error("Error joining game:", error);
      let errorMessage = "Failed to join the game.";
      if (error instanceof Error) {
        if (error.message.includes("NotEnoughFunds")) {
          errorMessage = "Not enough SOL to join the game. Please request SOL from the faucet.";
        } else if (error.message.includes("GameIsFull")) {
          errorMessage = "The game is full and cannot accept more players.";
        } else if (error.message.includes("GameAlreadyStarted")) {
          errorMessage = "The game has already started.";
        } else if (error.message.includes("PlayerAlreadyInGame")) {
          errorMessage = "You have already joined the game.";
        }
      }
      setJoinError(errorMessage);
    } finally {
      setIsJoiningGame(false);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast.info("Invite link copied to clipboard!");
  };

  const handleRetry = () => {
    setPlayerSetupError(null);
    setJoinError(null);
    setupPlayerAndFetchGame();
  };

  const handleRequestSOL = () => {
    window.open(process.env.REACT_APP_FAUCET_URL, "_blank");
  };

  const playerPublicKey = getPublicKey();

  return (
    <div className="matchmaking-container">
      <ToastContainer autoClose={2500} theme="dark" />
      {loading ? (
        <div className="status-message">
          <h2>Loading game data...</h2>
        </div>
      ) : playerSetupError || joinError ? (
        <div className="error-message">
          <h2>{playerSetupError || joinError}</h2>
          {playerSetupError && (
            <>
              <button onClick={handleRetry}>Retry</button>
            </>
          )}
          {joinError && joinError.includes("SOL") && (
            <button onClick={handleRequestSOL}>Request SOL from Faucet</button>
          )}
          <button onClick={() => navigate("/")}>Go to Home Page</button>
        </div>
      ) : (
        <div>
          {gameData && gameData.status && gameData.status.notStarted && (
            <>
              {!gameData.players.some(
                (p: any) => p && p.pubkey && p.pubkey.toBase58() === playerPublicKey?.toBase58()
              ) ? (
                <div className="join-game-container">
                  <h2>The game is ready to join.</h2>
                  <button onClick={joinGame} disabled={isJoiningGame}>
                    {isJoiningGame ? "Joining..." : "Join Game"}
                  </button>
                </div>
              ) : gameData.creator.toBase58() === playerPublicKey?.toBase58() ? (
                <div className="status-message">
                  <div className="spinner"></div>
                  <h2>Waiting for your opponent...</h2>
                  <div className="invite-link-container">
                    <p>Invite opponent using this link:</p>
                    <div className="invite-link">
                      <pre>{window.location.href}</pre>
                      <button onClick={handleCopyLink}>Copy</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="status-message">
                  <h2>Waiting for the game to start...</h2>
                </div>
              )}
            </>
          )}
          {gameData && gameData.status && gameData.status.live && (
            <div className="status-message">
              <h2>Opponent has joined. Starting game...</h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchMakingPage;
