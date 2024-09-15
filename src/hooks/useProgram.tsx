import { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl, Wallet } from '@coral-xyz/anchor';
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import idl from '../idl.json';
import { Keypair } from '@solana/web3.js';

const useProgram = () => {
  const connection = useMemo(() => {
    return new Connection("http://127.0.0.1:8899", "processed");
  }, []);

  const getBurnerWallet = () => {
    const localStorageKey = "superPlaygroundKey";
    const storedKey = localStorage.getItem(localStorageKey);
    if (storedKey) {
      const secretKeyArray = JSON.parse(storedKey);
      const secretKey = Uint8Array.from(secretKeyArray);
      return Keypair.fromSecretKey(secretKey);
    }
    return null;
  };

  const program = useMemo(() => {
    const keypair = getBurnerWallet();

    if (!keypair) {
      console.error("Burner wallet not found.");
      return null;
    }

    const wallet = new NodeWallet(keypair);

    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });

    return new Program(idl as Idl, provider);
  }, [connection]);

  return program;
};

export default useProgram;
