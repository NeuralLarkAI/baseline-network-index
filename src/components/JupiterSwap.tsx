import React, { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";

// Mainnet mints
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type MintOption = { symbol: string; mint: string; decimals: number };
const OPTIONS: MintOption[] = [
  { symbol: "SOL", mint: SOL_MINT, decimals: 9 },
  { symbol: "USDC", mint: USDC_MINT, decimals: 6 },
];

export default function JupiterSwap() {
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

  async function swap() {
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

      setStatus("Building swap transaction...");
      const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: wallet.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
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

      setStatus(`✅ Swap sent: ${sig}`);
    } catch (e: any) {
      setStatus(`❌ ${e?.message || String(e)}`);
    }
  }

  function flip() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, maxWidth: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Swap (Jupiter)</h3>
        <WalletMultiButton />
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <label>
          <div style={{ opacity: 0.8, fontSize: 12 }}>From</div>
          <select
            value={from.mint}
            onChange={(e) => setFrom(OPTIONS.find(o => o.mint === e.target.value) || OPTIONS[0])}
            style={{ width: "100%", padding: 10, borderRadius: 10 }}
          >
            {OPTIONS.map(o => <option key={o.mint} value={o.mint}>{o.symbol}</option>)}
          </select>
        </label>

        <button onClick={flip} style={{ padding: 10, borderRadius: 10 }}>
          ⇅ Flip
        </button>

        <label>
          <div style={{ opacity: 0.8, fontSize: 12 }}>To</div>
          <select
            value={to.mint}
            onChange={(e) => setTo(OPTIONS.find(o => o.mint === e.target.value) || OPTIONS[1])}
            style={{ width: "100%", padding: 10, borderRadius: 10 }}
          >
            {OPTIONS.map(o => <option key={o.mint} value={o.mint}>{o.symbol}</option>)}
          </select>
        </label>

        <label>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Amount</div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            style={{ width: "100%", padding: 10, borderRadius: 10 }}
          />
        </label>

        <label>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Slippage</div>
          <select
            value={slippageBps}
            onChange={(e) => setSlippageBps(Number(e.target.value))}
            style={{ width: "100%", padding: 10, borderRadius: 10 }}
          >
            <option value={50}>0.50%</option>
            <option value={100}>1.00%</option>
            <option value={200}>2.00%</option>
          </select>
        </label>

        <button
          onClick={swap}
          disabled={!wallet.connected}
          style={{ padding: 12, borderRadius: 12, fontWeight: 700 }}
        >
          Swap Now
        </button>

        {status && <div style={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>{status}</div>}
      </div>
    </div>
  );
}
