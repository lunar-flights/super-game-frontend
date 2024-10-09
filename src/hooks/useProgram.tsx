import { useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import idl from "../idl.json";
import useLocalWallet from "./useLocalWallet";

const useProgram = () => {
  const { wallet } = useLocalWallet();

  const connection = useMemo(() => {
    return new Connection(process.env.REACT_APP_RPC_URL || "https://api.devnet.solana.com", "processed");
  }, []);

  const program = useMemo(() => {
    if (!wallet) {
      console.error("Burner wallet not found.");
      return null;
    }

    const nodeWallet = new NodeWallet(wallet);
    const provider = new AnchorProvider(connection, nodeWallet, { preflightCommitment: "processed" });

    return new Program(idl as Idl, provider);
  }, [connection, wallet]);

  return program;
};

export default useProgram;
