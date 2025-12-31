import React, { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";

// ---- Baseline token + socials (edit anytime) ----
const BASELINE_CA = "AizfoGZzePnMpCn1ae19VY5vEpfDvE85qZ6Amy9Ppump";
const BASELINE_SITE = "https://baseline-network-index.vercel.app";
const BASELINE_X = "https://x.com/BaslineNet";
// ------------------------------------------------

// Mainnet mints
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type MintOption = { symbol: string; mint: string; decimals: number };

const OPTIONS: MintOption[] = [
  { symbol: "SOL", mint: SOL_MINT, decimals: 9 },
  { symbol: "USDC", mint: USDC_MINT, decimals: 6 },
];

function shortAddr(a: string) {
  if (!a) return "";
  if (a.length <= 14) return a;
  return `${a.slice(0, 6)}…${a.slice(-6)}`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function BaselineSwapPanel() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [from, setFrom] = useState<MintOption>(OPTIONS[0]);
  const [to, setTo] = useState<MintOption>(OPTIONS[1]);
  const [amount, setAmount] = useState<string>("0.01");
  const [slippageBps, setSlippageBps] = useState<number>(100); // 1.00%
  const [status, setStatus] = useState<string>("");

  const amountInBaseUnits = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n * 10 ** from.decimals);
  }, [amount, from.decimals]);

  async function getQuote() {
    if (!amountInBaseUnits) throw new Error("Enter an amount > 0");
    const url =
      `https://quote-api.jup.ag/v6/quote` +
      `?inputMint=${from.mint}` +
      `&outputMint=${to.mint}` +
      `&amount=${amountInBaseUnits}` +
      `&slippageBps=${slippageBps}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Quote failed: ${res.status}`);
    return res.json();
  }

  async function doSwap() {
    try {
      setStatus("");

      if (!wallet.connected || !wallet.publicKey) {
        setStatus("Connect wallet first.");
        return;
      }
      if (!wallet.signTransaction) {
        setStatus("Wallet cannot sign transactions.");
        return;
      }

      setStatus("Getting quote...");
      const quote = await getQuote();

      setStatus("Building swap tx...");
      const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: wallet.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto"
        }),
      });

      if (!swapRes.ok) throw new Error(`Swap build failed: ${swapRes.status}`);
      const { swapTransaction } = await swapRes.json();
      if (!swapTransaction) throw new Error("No swapTransaction returned from Jupiter.");

      const txBuf = Buffer.from(swapTransaction, "base64");
      const tx = VersionedTransaction.deserialize(txBuf);

      setStatus("Signing...");
      const signed = await wallet.signTransaction(tx);

      setStatus("Sending...");
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      setStatus("Confirming...");
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed"
      );

      setStatus(`✅ Swap confirmed: ${sig}`);
    } catch (e: any) {
      setStatus(`❌ ${e?.message || String(e)}`);
    }
  }

  async function onCopyCA() {
    const ok = await copyToClipboard(BASELINE_CA);
    setStatus(ok ? "✅ CA copied to clipboard" : "❌ Copy failed (browser blocked clipboard)");
    setTimeout(() => setStatus(""), 2500);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 999999,
        width: 420,
        maxWidth: "calc(100vw - 32px)",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(10px)",
        borderRadius: 18,
        padding: 14,
        boxShadow: "0 10px 40px rgba(0,0,0,0.45)"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Baseline</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Wallet + Jupiter Swap
          </div>
        </div>
        <WalletMultiButton />
      </div>

      {/* CA + Socials */}
      <div
        style={{
          marginTop: 12,
          borderRadius: 14,
          padding: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          display: "grid",
          gap: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Contract (CA)</div>
          <button
            onClick={onCopyCA}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 12
            }}
          >
            Copy
          </button>
        </div>

        <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 13 }}>
          {BASELINE_CA}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href={BASELINE_SITE}
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: 12
            }}
          >
            Website
          </a>
          <a
            href={BASELINE_X}
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: 12
            }}
          >
            X / BaslineNet
          </a>
        </div>
      </div>

      {/* Swap UI */}
      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>From</div>
          <select
            value={from.mint}
            onChange={(e) => setFrom(OPTIONS.find(o => o.mint === e.target.value) || OPTIONS[0])}
            style={{ padding: 10, borderRadius: 12 }}
          >
            {OPTIONS.map(o => (
              <option key={o.mint} value={o.mint}>{o.symbol}</option>
            ))}
          </select>
        </label>

        <button onClick={() => { const a = from; setFrom(to); setTo(a); }} style={{ padding: 10, borderRadius: 12, fontWeight: 900 }}>
          ⇅ Flip
        </button>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>To</div>
          <select
            value={to.mint}
            onChange={(e) => setTo(OPTIONS.find(o => o.mint === e.target.value) || OPTIONS[1])}
            style={{ padding: 10, borderRadius: 12 }}
          >
            {OPTIONS.map(o => (
              <option key={o.mint} value={o.mint}>{o.symbol}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Amount</div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            style={{ padding: 10, borderRadius: 12 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Slippage</div>
          <select
            value={slippageBps}
            onChange={(e) => setSlippageBps(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 12 }}
          >
            <option value={50}>0.50%</option>
            <option value={100}>1.00%</option>
            <option value={200}>2.00%</option>
          </select>
        </label>

        <button
          onClick={doSwap}
          style={{ padding: 12, borderRadius: 14, fontWeight: 950 }}
          disabled={!wallet.connected}
          title={!wallet.connected ? "Connect wallet first" : "Swap via Jupiter"}
        >
          Swap Now
        </button>

        {wallet.publicKey && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Connected:{" "}
            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              {shortAddr(wallet.publicKey.toBase58())}
            </span>
          </div>
        )}

        {status && (
          <div style={{ fontSize: 12, opacity: 0.95, whiteSpace: "pre-wrap" }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
