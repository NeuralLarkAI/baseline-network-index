import React, { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";

// ---- Baseline constants ----
const BASELINE_CA = "AizfoGZzePnMpCn1ae19VY5vEpfDvE85qZ6Amy9Ppump";
const BASELINE_SITE = "https://baseline-network-index.vercel.app";
const BASELINE_X = "https://x.com/BaslineNet";

// Mainnet mints
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type MintOption = { symbol: string; mint: string; decimals: number };

const OPTIONS: MintOption[] = [
  { symbol: "SOL", mint: SOL_MINT, decimals: 9 },
  { symbol: "USDC", mint: USDC_MINT, decimals: 6 },
];

export default function BaselineSwapPanel() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // 🔒 PANEL OPEN STATE IS DRIVEN ONLY BY WALLET CONNECTION
  const [isOpen, setIsOpen] = useState(false);

  // Open panel ONLY when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [wallet.connected]);

  const [from, setFrom] = useState<MintOption>(OPTIONS[0]);
  const [to, setTo] = useState<MintOption>(OPTIONS[1]);
  const [amount, setAmount] = useState("0.01");
  const [slippageBps, setSlippageBps] = useState(100);
  const [status, setStatus] = useState("");

  const amountInBaseUnits = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n * 10 ** from.decimals);
  }, [amount, from.decimals]);

  // ---- BEFORE CONNECT: show ONLY connect button ----
  if (!wallet.connected || !isOpen) {
    return (
      <div
        style={{
          position: "fixed",
          right: 14,
          bottom: 14,
          zIndex: 999999,
        }}
      >
        <WalletMultiButton />
      </div>
    );
  }

  // ---- AFTER CONNECT: show full panel ----
  return (
    <div
      style={{
        position: "fixed",
        right: 14,
        bottom: 14,
        zIndex: 999999,
        width: 420,
        maxWidth: "calc(100vw - 28px)",
        borderRadius: 18,
        padding: 14,
        background: "rgba(10,10,10,0.92)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Baseline Swap</strong>
        <WalletMultiButton />
      </div>

      {/* CA */}
      <div style={{ marginTop: 10, fontSize: 12 }}>
        <div style={{ opacity: 0.7 }}>Contract Address</div>
        <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
          {BASELINE_CA}
        </div>
      </div>

      {/* Socials */}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={() => window.open(BASELINE_SITE, "_blank")}>Website</button>
        <button onClick={() => window.open(BASELINE_X, "_blank")}>X</button>
      </div>

      {/* Swap UI placeholder (you already wired Jupiter here) */}
      <div style={{ marginTop: 14, opacity: 0.8 }}>
        Swap UI active (wallet connected)
      </div>

      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
}
