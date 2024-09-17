import { useState, useEffect } from "react";
import { Keypair } from "@solana/web3.js";

const localStorageKey = "superPlaygroundKey";

const useLocalWallet = () => {
  const [wallet, setWallet] = useState<Keypair | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem(localStorageKey);
    if (storedKey) {
      const secretKey = Uint8Array.from(JSON.parse(storedKey));
      const keypair = Keypair.fromSecretKey(secretKey);
      setWallet(keypair);
    } else {
      const keypair = Keypair.generate();
      localStorage.setItem(localStorageKey, JSON.stringify(Array.from(keypair.secretKey)));
      setWallet(keypair);
    }
  }, []);

  const getPublicKey = () => {
    return wallet?.publicKey ?? null;
  };

  return { wallet, getPublicKey };
};

export default useLocalWallet;
