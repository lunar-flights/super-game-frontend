import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faFireFlameSimple,
  faPlane,
  faCity,
  faBuildingCircleXmark,
  faBook,
} from "@fortawesome/free-solid-svg-icons";
import { faXTwitter, faGithub } from "@fortawesome/free-brands-svg-icons";
import useProgram from "../hooks/useProgram";
import useLocalWallet from "../hooks/useLocalWallet";
import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const program = useProgram();
  const { wallet, getPublicKey } = useLocalWallet();
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);

  useEffect(() => {
    requestAirdrop();
  }, [wallet]);

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
        .createGame(4, false, { small: {} })
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

  const challenges = [
    { id: 0, name: "Win in playground mode", icon: faRobot },
    { id: 1, name: "Build gas plant", icon: faFireFlameSimple },
    { id: 2, name: "Build a plane", icon: faPlane },
    { id: 3, name: "Upgrade capital to max level", icon: faCity },
    { id: 4, name: "Destroy enemy capital", icon: faBuildingCircleXmark },
  ];

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

          <div className="challenges">
            <hr />
            <h3>Challenges</h3>
            <div className="challenge-list">
              {challenges.map((challenge) => {
                const isCompleted = completedChallenges.includes(challenge.id);
                return (
                  <div key={challenge.id}>
                    <div
                      data-tooltip-id={`challenge-${challenge.id}`}
                      data-tooltip-content={challenge.name}
                      className={`challenge-badge ${isCompleted ? "unlocked" : "pending"}`}
                    >
                      <FontAwesomeIcon icon={challenge.icon} />
                    </div>
                    <ReactTooltip place="top" id={`challenge-${challenge.id}`} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lootbox">
            <div className="lootbox-content">
              <div className="lootbox-text">Complete all challenges to claim NFT badge!</div>
              <div className="badge-container">
                <div className="shining-container">
                  <div className="shining-effect"></div>
                </div>
                <img src="/ui/badge.png" alt="NFT badge" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="banner tutorial" onClick={handlePlaygroundClick}>
          <div className="banner-text">
            <h2>Playground</h2>
            <p>Play with a bot to learn basics</p>
          </div>
          <div className="banner-image">
            <img src="/ui/robot.png" alt="Bot" />
          </div>
        </div>

        <div className="banner multiplayer" onClick={() => navigate("/multiplayer")}>
          <div className="banner-text">
            <h2>Multiplayer</h2>
            <p>Bet 0.10 SOL against other players</p>
          </div>
          <div className="banner-image">
            <img src="/ui/human.png" alt="Multiplayer" />
          </div>
        </div>

        <div className="bottom-links">
          <div className="link-button">
            <button onClick={() => navigate("/docs")}>
              <FontAwesomeIcon icon={faBook} className="desktop-only" /> Documentation
            </button>
          </div>
          <div className="link-button">
            <button onClick={() => window.open("https://x.com/supergm", "_blank")}>
              <FontAwesomeIcon icon={faXTwitter} /> Follow
            </button>
          </div>
          <div className="link-button">
            <button onClick={() => window.open("https://github.com/lunar-flights/super-game", "_blank")}>
              <FontAwesomeIcon icon={faGithub} /> <span className="desktop-only">Contribute</span>
              <span className="mobile-only">GitHub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
