import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import useProgram from "../hooks/useProgram";
import useLocalWallet from "../hooks/useLocalWallet";
import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const program = useProgram();
  const { wallet, getPublicKey } = useLocalWallet();
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [solBalance, setSolBalance] = useState<number>(0);

  const requestAirdrop = async () => {
    try {
      const playerPublicKey = getPublicKey();
      if (!playerPublicKey || !program) {
        console.error("Program not initialized or wallet not found.");
        return;
      }
      const connection = program!.provider.connection;
      const balance = await connection.getBalance(playerPublicKey);
      setSolBalance(balance / 1e9);
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

  const playerPublicKey = getPublicKey();

  return (
    <div className="homepage-container">
      <div className="left-section">
        <div className="player-info">
          <div className="wallet-info">
            <div className="wallet-header">
              <span className="label">Session Wallet</span>
              <span className="balance">{solBalance.toFixed(2)} SOL</span>
            </div>
            <div className="wallet-address">
              <pre>{playerPublicKey?.toBase58()}</pre>
              <button onClick={requestAirdrop}>Faucet</button>
            </div>
          </div>

          <div className="player-stats">
            <div className="stat">
              <span className="stat-label">Games Completed</span>
              <span className="stat-value">{playerProfile ? playerProfile.gamesCompleted : 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">XP</span>
              <span className="stat-value">{playerProfile ? playerProfile.xp : 0}</span>
            </div>
          </div>

          <div className="lootbox">
            <div className="lootbox-text">Complete the tutorial to claim loot box NFT</div>
            <div className="lootbox-content">
              <img src="/ui/lootbox.png" alt="Loot Box" />
              <button disabled>Claim</button>
            </div>
          </div>
        </div>

        <div className="social-buttons">
          <button className="social-button">
            <img src="/icons/twitter.png" alt="Twitter" />
            Follow
          </button>
          <button className="social-button">
            <img src="/icons/discord.png" alt="Discord" />
            Chat
          </button>
          <button className="social-button">
            <img src="/icons/github.png" alt="GitHub" />
            Contribute
          </button>
        </div>
      </div>

      <div className="right-section">
        <div className="banner" onClick={handlePlaygroundClick}>
          <div className="banner-text">
            <h2>Tutorial Playground</h2>
            <p>Play with a bot to learn basics</p>
          </div>
          <div className="banner-image">
            <img src="/ui/robot.png" alt="Bot" />
          </div>
        </div>

        <div className="banner" onClick={() => navigate("/multiplayer")}>
          <div className="banner-text">
            <h2>Multiplayer</h2>
            <p>Risk SOL - win SOL</p>
          </div>
          <div className="banner-image">
            <img src="/ui/human.png" alt="Multiplayer" />
          </div>
        </div>

        <div className="bottom-links">
          <div className="link-button">
            <button onClick={() => navigate("/docs")}>Documentation</button>
          </div>
          <div className="link-button">
            <button onClick={() => window.open("https://youtube.com", "_blank")}>
              <img src="/icons/youtube.png" alt="YouTube" />
              Video Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
